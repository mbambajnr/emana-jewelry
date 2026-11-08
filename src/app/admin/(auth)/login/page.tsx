"use client"

import { useActionState } from "react"
import Link from "next/link"
import { login } from "@/app/actions/auth"
import styles from "./login.module.css"

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Admin Login</h1>
        <p className={styles.intro}>{state?.step === "code" ? "Enter the code sent to your admin email." : "Enter your admin email. We’ll send you a code to sign in."}</p>
        {state?.message && <p className={styles.notice} role="status">{state.message}</p>}
        {state?.error && (
          <p className={styles.error} role="alert">{state.error}</p>
        )}
        <form action={action} className={styles.form}>
          {state?.step === "code" ? <>
            <div className={styles.field}><label htmlFor="code" className={styles.label}>Sign-in code</label><input key={state.message} id="code" name="code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{8}" maxLength={8} minLength={8} required autoFocus className={`${styles.input} ${styles.code}`} aria-describedby="code-help" /></div>
            <p id="code-help" className={styles.help}>Use the latest eight-digit code. You have five attempts. Check spam if the email hasn’t arrived.</p>
            <label className={styles.remember}><input type="checkbox" name="remember" /> Keep me signed in for 7 days on this device</label>
            <p className={styles.help}>Use this only on a device you trust. Otherwise, you’ll stay signed in for 12 hours.</p>
            <button type="submit" name="intent" value="verify" disabled={pending} className={styles.button}>{pending ? "Please wait…" : "Verify & Sign In"}</button>
            <button type="submit" name="intent" value="resend" formNoValidate disabled={pending} className={styles.secondary}>Send a new code</button>
            <p className={styles.help}>Wait one minute between codes. Requesting another code does not extend this sign-in’s 10-minute time limit.</p>
            <button type="submit" name="intent" value="restart" formNoValidate disabled={pending} className={styles.secondary}>Back to email</button>
          </> : <>
          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className={styles.input}
              autoComplete="email"
            />
          </div>
          <button type="submit" disabled={pending} className={styles.button}>
            {pending ? "Sending…" : "Send login code"}
          </button>
          </>}
        </form>
        <nav className={styles.authLinks} aria-label="Sign-in help"><Link href="/admin/forgot-password">Manage admin password</Link></nav>
      </div>
    </div>
  )
}
