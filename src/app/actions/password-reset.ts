"use server"

import { randomBytes } from "node:crypto"
import { cookies, headers } from "next/headers"
import { after } from "next/server"
import { cancelAdminOtp, resendAdminOtp, startAdminOtp, OTP_LIFETIME } from "@/lib/admin-otp"
import { completePasswordReset } from "@/lib/admin-password-reset"
import { deleteSession } from "@/lib/auth"
import { consumeLimit, trustedClient, RequestError } from "@/lib/request-safety"
import { sendAdminPasswordResetNotice } from "@/lib/notifications"

const COOKIE = "admin_password_reset"
const MESSAGE = "If this matches the admin email, a reset code will be sent. Check your inbox and spam folder, and use the latest email."
type State = { step: "email" | "code" | "done"; error?: string; message?: string }
async function clearCookie() {
  (await cookies()).set(COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/admin", maxAge: 0 })
}
export async function resetPassword(_prev: unknown, form: FormData): Promise<State> {
  const intent = form.get("intent"), store = await cookies(), pendingToken = store.get(COOKIE)?.value
  const client = trustedClient(new Headers(await headers()))
  try {
    await consumeLimit("password-reset-site", "site", client ? 100 : 30)
    if (client) await consumeLimit("password-reset-client", client, 10)
    if (intent === "restart") {
      after(async () => { try { await cancelAdminOtp(pendingToken, "password-reset") } catch { /* A pending token grants no admin session. */ } })
      await clearCookie()
      return { step: "email" }
    }
    if (intent === "begin") {
      const address = form.get("email")
      if (typeof address !== "string" || address.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.trim())) return { step: "email", error: "Enter a valid email address." }
      const email = address.trim().toLowerCase()
      await consumeLimit("password-reset-address", email, 5)
      const token = pendingToken && /^[a-f0-9]{64}$/.test(pendingToken) ? pendingToken : randomBytes(32).toString("hex")
      store.set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/admin", expires: new Date(Date.now() + OTP_LIFETIME) })
      // Return the same response before account lookup/email I/O for all valid addresses.
      after(async () => {
        if (email !== process.env.ADMIN_EMAIL?.trim().toLowerCase()) return
        try { await startAdminOtp("password-reset", undefined, undefined, token) }
        catch { console.warn("An admin recovery code could not be sent. Check email configuration and request limits.") }
      })
      return { step: "code", message: MESSAGE }
    }
    if (intent === "resend") {
      after(async () => { try { await resendAdminOtp(pendingToken, "password-reset") } catch { /* Preserve the same public response for invalid and valid requests. */ } })
      return { step: "code", message: MESSAGE }
    }
    if (intent !== "verify") return { step: "email", error: "Please start the password reset again." }
    const code = form.get("code"), next = form.get("newPassword"), confirm = form.get("confirmPassword")
    if (typeof next !== "string" || Array.from(next).length < 12 || next.length > 128) return { step: "code", error: "Use a new password of 12–128 characters." }
    if (next !== confirm) return { step: "code", error: "The new passwords do not match." }
    try {
      await completePasswordReset(pendingToken, typeof code === "string" ? code.trim() : "", next, next)
    } catch {
      return { step: "code", error: "That code is invalid or expired, or the new password could not be accepted. Check the code, choose a different password, or request a new code." }
    }
    await clearCookie()
    await deleteSession()
    const recipient = process.env.ADMIN_EMAIL
    if (recipient) after(async () => { try { await sendAdminPasswordResetNotice(recipient) } catch { console.warn("Admin password reset confirmation email could not be sent.") } })
    return { step: "done", message: "Your password has been reset. Sign in using your admin email and a fresh login code. Your new password is used for security settings." }
  } catch (error) {
    return { step: intent === "begin" || intent === "restart" ? "email" : "code", error: error instanceof RequestError ? error.message : "Password recovery is temporarily unavailable. Please try again shortly." }
  }
}
