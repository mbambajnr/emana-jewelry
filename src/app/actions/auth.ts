"use server"

import { headers, cookies } from "next/headers"
import { consumeLimit, trustedClient, RequestError } from "@/lib/request-safety"
import { redirect } from "next/navigation"
import { createSession, deleteSession, verifyPassword } from "@/lib/auth"
import { startAdminOtp, verifyAdminOtp, resendAdminOtp, cancelAdminOtp, OtpError } from "@/lib/admin-otp"
import { readAdminPasswordHash } from "@/lib/admin-credentials"

const CHALLENGE_COOKIE = "admin_login_challenge"
async function clearChallengeCookie() {
  const store = await cookies()
  store.set(CHALLENGE_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/admin", maxAge: 0 })
}
type LoginState = { step: "password" | "code"; error?: string; message?: string }
const safeError = (error: unknown) => error instanceof OtpError || error instanceof RequestError ? error.message : "Sign-in is temporarily unavailable. Please try again shortly."

export async function login(_prev: unknown, formData: FormData): Promise<LoginState> {
  const intent = formData.get("intent")
  if (intent === "restart") {
    const store = await cookies()
    try { await cancelAdminOtp(store.get(CHALLENGE_COOKIE)?.value) } catch { /* No pending token grants admin access. */ }
    await clearChallengeCookie()
    return { step: "password" }
  }
  if (intent === "verify" || intent === "resend") {
    const store = await cookies()
    let verifiedEmail: string | undefined
    try {
      await consumeLimit("admin-code-check-site", "site", 100)
      const client = trustedClient(new Headers(await headers()))
      if (client) await consumeLimit("admin-code-check-client", client, 20)
      if (intent === "resend") {
        await resendAdminOtp(store.get(CHALLENGE_COOKIE)?.value)
        return { step: "code", message: "A new code has been sent. Use the latest email; your previous code no longer works." }
      }
      const code = formData.get("code")
      const verifiedPasswordHash = await readAdminPasswordHash()
      verifiedEmail = await verifyAdminOtp(store.get(CHALLENGE_COOKIE)?.value, typeof code === "string" ? code.trim() : "")
      await createSession(verifiedEmail, verifiedPasswordHash)
      await clearChallengeCookie()
    } catch (error) {
      const restart = error instanceof OtpError && error.restart
      if (restart) await clearChallengeCookie()
      return { step: restart ? "password" : "code", error: safeError(error) }
    }
    redirect("/admin")
  }
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const adminEmail = process.env.ADMIN_EMAIL
  let adminHash: string | undefined

  if (typeof email !== "string" || typeof password !== "string" || !email || email.length > 254 || !password || password.length > 1024 || !adminEmail || !process.env.ADMIN_PASSWORD_HASH) {
    return { step: "password", error: "Invalid credentials" }
  }

  try {
    await consumeLimit("login-site", "site", 50)
    await consumeLimit("login-account", email.trim().toLowerCase(), 8)
    const client = trustedClient(new Headers(await headers()))
    if (client) await consumeLimit("login-client", client, 12)
  } catch (error) { return { step: "password", error: safeError(error) } }

  let passwordValid = false
  try { adminHash = await readAdminPasswordHash(); passwordValid = await verifyPassword(password, adminHash) } catch { return { step: "password", error: "Sign-in is temporarily unavailable." } }
  if (email !== adminEmail || !passwordValid) return { step: "password", error: "Invalid credentials" }
  try {
    await deleteSession()
    const challenge = await startAdminOtp()
    const store = await cookies()
    store.set(CHALLENGE_COOKIE, challenge.token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/admin", expires: challenge.expiresAt })
    return { step: "code", message: "Check your admin email for an eight-digit sign-in code. It expires in 10 minutes." }
  } catch (error) { return { step: "password", error: safeError(error) } }
}

export async function logout() {
  const store = await cookies()
  try { await cancelAdminOtp(store.get(CHALLENGE_COOKIE)?.value) } catch { /* Always allow sign-out. */ }
  await clearChallengeCookie()
  await deleteSession()
  redirect("/admin/login")
}
