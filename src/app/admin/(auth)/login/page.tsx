"use client"

import { useActionState } from "react"
import { login } from "@/app/actions/auth"
import styles from "./login.module.css"

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Admin Login</h1>
        {state?.error && (
          <p className={styles.error}>{state.error}</p>
        )}
        <form action={action} className={styles.form}>
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
          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className={styles.input}
              autoComplete="current-password"
            />
          </div>
          <button type="submit" disabled={pending} className={styles.button}>
            {pending ? "Signing In…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  )
}
