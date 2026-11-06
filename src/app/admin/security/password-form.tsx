"use client"

import { useActionState } from "react"
import { changePassword } from "@/app/actions/security"
import styles from "./security.module.css"

export default function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, undefined)
  return <section className={styles.page}><h1>Security</h1><p>Change your admin password. You’ll confirm the change with a code sent to your admin email.</p>
    {state?.error && <p role="alert" className={styles.error}>{state.error}</p>}
    {state?.message && <p role="status" className={styles.notice}>{state.message}</p>}
    <form action={action} className={styles.form}>
      {state?.step === "code" ? <>
        <label htmlFor="password-code">Email verification code</label><input id="password-code" name="code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{8}" minLength={8} maxLength={8} required autoFocus />
        <p>Use the latest eight-digit code. It expires 10 minutes after your request, with five attempts. Wait one minute between emails.</p>
        <button name="intent" value="verify" disabled={pending}>{pending ? "Please wait…" : "Confirm Password Change"}</button>
        <button name="intent" value="resend" formNoValidate disabled={pending} className={styles.secondary}>Send a new code</button>
        <button name="intent" value="cancel" formNoValidate disabled={pending} className={styles.secondary}>Cancel password change</button>
      </> : <>
        <label htmlFor="current-password">Current password</label><input id="current-password" name="currentPassword" type="password" autoComplete="current-password" required maxLength={1024} />
        <label htmlFor="new-password">New password</label><input id="new-password" name="newPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required aria-describedby="password-guidance" />
        <p id="password-guidance">Use 12–128 characters. A unique passphrase or a password manager’s suggestion works well.</p>
        <label htmlFor="confirm-password">Confirm new password</label><input id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
        <button name="intent" value="begin" disabled={pending}>{pending ? "Checking…" : "Send Confirmation Code"}</button>
      </>}
      <p>After confirmation, all admin sessions will be signed out. Sign in again with your new password and the usual email code.</p>
    </form>
  </section>
}
