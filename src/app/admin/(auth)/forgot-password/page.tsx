"use client"

import { useActionState } from "react"
import Link from "next/link"
import { resetPassword } from "@/app/actions/password-reset"
import styles from "../login/login.module.css"

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(resetPassword, undefined)
  const step = state?.step || "email"
  return <div className={styles.page}><section className={styles.card}>
    <h1 className={styles.title}>{step === "done" ? "Password Reset" : "Forgot Password?"}</h1>
    <p className={styles.intro}>{step === "email" ? "Enter your admin email. We’ll send a code so you can choose a new password." : step === "code" ? "Enter the reset code from your email and choose a new password." : "Your existing admin sessions have been signed out."}</p>
    {state?.message && <p role="status" className={styles.notice}>{state.message}</p>}
    {state?.error && <p role="alert" className={styles.error}>{state.error}</p>}
    {step !== "done" && <form action={action} className={styles.form}>
      {step === "email" ? <>
        <div className={styles.field}><label htmlFor="reset-email" className={styles.label}>Admin email</label><input id="reset-email" name="email" type="email" required autoComplete="email" maxLength={254} className={styles.input} /></div>
        <button name="intent" value="begin" disabled={pending} className={styles.button}>{pending ? "Please wait…" : "Send Reset Code"}</button>
      </> : <>
        <div className={styles.field}><label htmlFor="reset-code" className={styles.label}>Reset code</label><input id="reset-code" name="code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{8}" minLength={8} maxLength={8} required autoFocus className={`${styles.input} ${styles.code}`} /></div>
        <div className={styles.field}><label htmlFor="reset-password" className={styles.label}>New password</label><input id="reset-password" name="newPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required className={styles.input} aria-describedby="reset-help" /></div>
        <div className={styles.field}><label htmlFor="reset-confirm" className={styles.label}>Confirm new password</label><input id="reset-confirm" name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required className={styles.input} /></div>
        <p id="reset-help" className={styles.help}>Use 12–128 characters. Reset codes expire after 10 minutes and allow five attempts. Resending does not extend the time limit.</p>
        <button name="intent" value="verify" disabled={pending} className={styles.button}>{pending ? "Please wait…" : "Reset Password"}</button>
        <button name="intent" value="resend" formNoValidate disabled={pending} className={styles.secondary}>Send a new code</button>
        <p className={styles.help}>Wait at least one minute between codes. Check spam if an email hasn’t arrived.</p>
        <button name="intent" value="restart" formNoValidate disabled={pending} className={styles.secondary}>Start again</button>
      </>}
    </form>}
    <nav className={styles.authLinks} aria-label="Account access"><Link href="/admin/login">{step === "done" ? "Sign in with your new password" : "Back to sign in"}</Link></nav>
  </section></div>
}
