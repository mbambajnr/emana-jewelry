"use server"

import { randomBytes } from "node:crypto"
import { after } from "next/server"
import { headers, cookies } from "next/headers"
import { consumeLimit, trustedClient, RequestError } from "@/lib/request-safety"
import { redirect } from "next/navigation"
import { createSession, deleteSession } from "@/lib/auth"
import { startAdminOtp, verifyAdminOtp, resendAdminOtp, cancelAdminOtp, OTP_LIFETIME, OtpError } from "@/lib/admin-otp"
import { readAdminPasswordHash } from "@/lib/admin-credentials"

const CHALLENGE_COOKIE = "admin_login_challenge"
async function clearChallengeCookie() {
  const store = await cookies()
  store.set(CHALLENGE_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/admin", maxAge: 0 })
}
type LoginState = { step: "email" | "code"; error?: string; message?: string }
const safeError = (error: unknown) => error instanceof OtpError || error instanceof RequestError ? error.message : "Sign-in is temporarily unavailable. Please try again shortly."

export async function login(_prev: unknown, formData: FormData): Promise<LoginState> {
  const intent = formData.get("intent")
  if (intent === "restart") {
    const store = await cookies()
    try { await cancelAdminOtp(store.get(CHALLENGE_COOKIE)?.value) } catch { /* No pending token grants admin access. */ }
    await clearChallengeCookie()
    return { step: "email" }
  }
  if (intent === "verify" || intent === "resend") {
    const store = await cookies()
    let verifiedEmail: string | undefined
    try {
      await consumeLimit("admin-code-check-site", "site", 100)
      const client = trustedClient(new Headers(await headers()))
      if (client) await consumeLimit("admin-code-check-client", client, 20)
      if (intent === "resend") {
        const token = store.get(CHALLENGE_COOKIE)?.value
        after(async () => { try { await resendAdminOtp(token) } catch { console.warn("An admin login code could not be resent. Check email configuration and request limits.") } })
        return { step: "code", message: "If this matches the admin email, a code will arrive shortly. Wait at least one minute between requests and use the latest email." }
      }
      const code = formData.get("code")
      const verifiedPasswordHash = await readAdminPasswordHash()
      verifiedEmail = await verifyAdminOtp(store.get(CHALLENGE_COOKIE)?.value, typeof code === "string" ? code.trim() : "")
      await createSession(verifiedEmail, verifiedPasswordHash, formData.get("remember") === "on")
      await clearChallengeCookie()
    } catch (error) {
      const restart = error instanceof OtpError && error.restart
      if (restart) await clearChallengeCookie()
      return { step: restart ? "email" : "code", error: safeError(error) }
    }
    redirect("/admin")
  }
  const address = formData.get("email")
  if (typeof address !== "string" || address.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.trim())) return { step: "email", error: "Enter a valid email address." }
  const email = address.trim().toLowerCase()
  try {
    await consumeLimit("login-site", "site", 50)
    await consumeLimit("login-account", email, 8)
    const client = trustedClient(new Headers(await headers()))
    if (client) await consumeLimit("login-client", client, 12)
    const token = randomBytes(32).toString("hex")
    await deleteSession()
    const store = await cookies()
    store.set(CHALLENGE_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/admin", expires: new Date(Date.now() + OTP_LIFETIME) })
    // Identical response and cookie shape for all addresses; delivery happens after responding.
    after(async () => {
      if (email !== process.env.ADMIN_EMAIL?.trim().toLowerCase()) return
      try { await startAdminOtp("login", undefined, undefined, token) }
      catch { console.warn("An admin login code could not be sent. Check email configuration and request limits.") }
    })
    return { step: "code", message: "If this matches the admin email, a code will arrive shortly. Check your inbox and spam folder. The code expires in 10 minutes." }
  } catch (error) { return { step: "email", error: safeError(error) } }
}

export async function logout() {
  const store = await cookies()
  try { await cancelAdminOtp(store.get(CHALLENGE_COOKIE)?.value) } catch { /* Always allow sign-out. */ }
  await clearChallengeCookie()
  await deleteSession()
  redirect("/admin/login")
}
