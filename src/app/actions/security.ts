"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { requireAdmin, deleteSession } from "@/lib/auth"
import { beginPasswordChange, completePasswordChange } from "@/lib/admin-password-change"
import { cancelAdminOtp, resendAdminOtp, OtpError } from "@/lib/admin-otp"
import { consumeLimit, RequestError } from "@/lib/request-safety"

const COOKIE = "admin_password_change"
type State = { step: "password" | "code"; error?: string; message?: string }
async function clearCookie() {
  (await cookies()).set(COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/admin", maxAge: 0 })
}
export async function changePassword(_prev: unknown, form: FormData): Promise<State> {
  const session = await requireAdmin()
  const intent = form.get("intent"), store = await cookies()
  try {
    if (intent === "cancel") {
      await cancelAdminOtp(store.get(COOKIE)?.value, "password-change")
      await clearCookie()
      return { step: "password", message: "Password change cancelled. Your password has not changed." }
    }
    await consumeLimit("password-change", session.email, intent === "begin" ? 5 : 20)
    if (intent === "resend") {
      await resendAdminOtp(store.get(COOKIE)?.value, "password-change")
      return { step: "code", message: "A new password change code has been sent. Use the latest email." }
    }
    if (intent === "verify") {
      const code = form.get("code")
      await completePasswordChange(store.get(COOKIE)?.value, typeof code === "string" ? code.trim() : "")
      await clearCookie()
      await deleteSession()
    } else if (intent === "begin") {
      const current = form.get("currentPassword"), next = form.get("newPassword"), confirm = form.get("confirmPassword")
      if (typeof current !== "string" || typeof next !== "string" || typeof confirm !== "string") throw new OtpError("Please complete all password fields.", true)
      const challenge = await beginPasswordChange(current, next, confirm)
      store.set(COOKIE, challenge.token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/admin", expires: challenge.expiresAt })
      return { step: "code", message: "Check your admin email for the eight-digit password change code. Your password stays unchanged until you confirm it." }
    } else throw new OtpError("Please start the password change again.", true)
  } catch (error) {
    const restart = error instanceof OtpError && error.restart
    if (restart) await clearCookie()
    return { step: restart || intent === "begin" ? "password" : "code", error: error instanceof OtpError || error instanceof RequestError ? error.message : "The password change could not be completed. Please try again shortly." }
  }
  redirect("/admin/login")
}
