"use client"

import { useEffect, useState, type FormEvent } from "react"
import Link from "next/link"
import styles from "@/app/admin/security/security.module.css"

type Settings = { host: string; port: number; username: string; sender: string; version: number; passwordSet: boolean; source?: string }
const defaults: Settings = { host: "smtp.gmail.com", port: 465, username: "", sender: "", version: 0, passwordSet: false }
export default function EmailSettingsForm({ setup = false }: { setup?: boolean }) {
  const [settings, setSettings] = useState(defaults), [loading, setLoading] = useState(!setup)
  const [password, setPassword] = useState(""), [currentPassword, setCurrentPassword] = useState(""), [setupKey, setSetupKey] = useState("")
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(""), [error, setError] = useState(""), [complete, setComplete] = useState(false)
  useEffect(() => {
    if (setup) return
    const controller = new AbortController()
    fetch("/api/admin/email", { cache: "no-store", signal: controller.signal }).then(async response => {
      const body = await response.json()
      if (!response.ok) throw new Error(body.error)
      setSettings(body.settings)
    }).catch(error => { if (error.name !== "AbortError") setError(error.message) }).finally(() => setLoading(false))
    return () => controller.abort()
  }, [setup])
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("")
    try {
      const response = await fetch(setup ? "/api/admin/email-setup" : "/api/admin/email", { method: setup ? "POST" : "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...settings, sender: settings.sender || `Emana Jewelry <${settings.username}>`, password, currentPassword, ...(setup ? { setupKey } : {}) }) })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error)
      setPassword(""); setCurrentPassword(""); setSetupKey(""); setMessage(body.message)
      if (body.settings) setSettings(body.settings)
      if (setup) setComplete(true)
    } catch (error) { setError(error instanceof Error ? error.message : "Email settings could not be saved.") }
    finally { setBusy(false) }
  }
  return <section className={styles.page} style={setup ? { margin: "64px auto", padding: "24px", width: "100%" } : undefined}>
    <h1>{setup ? "Set Up Admin Email" : "Email Settings"}</h1>
    <p>Connect Gmail to send admin codes and shop notifications. The app password is encrypted when saved and is never shown again.</p>
    {setup && <p>This page needs an expiring setup key from the site administrator and your current admin password. It configures email only; you’ll still need the usual email code to sign in.</p>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {message && <p role="status" className={styles.notice}>{message}</p>}
    {loading ? <p role="status">Loading email settings…</p> : !complete && <form onSubmit={submit} className={styles.form}>
      <fieldset disabled={busy} style={{ border: 0, padding: 0, display: "contents" }}>
        <label htmlFor="mail-host">SMTP server</label><input id="mail-host" value="smtp.gmail.com" readOnly />
        <label htmlFor="mail-port">Connection</label><select id="mail-port" value={settings.port} onChange={event => setSettings({ ...settings, host: "smtp.gmail.com", port: Number(event.target.value) })} style={{ minHeight: 48, padding: 12 }}><option value={465}>Port 465 · TLS</option><option value={587}>Port 587 · STARTTLS</option></select>
        <label htmlFor="mail-user">Gmail sending address</label><input id="mail-user" type="email" autoComplete="off" value={settings.username} required maxLength={254} onChange={event => setSettings({ ...settings, host: "smtp.gmail.com", username: event.target.value })} />
        <label htmlFor="mail-sender">From name and address (optional)</label><input id="mail-sender" placeholder="Emana Jewelry <your-mailbox@gmail.com>" value={settings.sender} maxLength={320} onChange={event => setSettings({ ...settings, sender: event.target.value })} />
        <label htmlFor="mail-secret">Google app password</label><input id="mail-secret" type="password" autoComplete="new-password" value={password} required={setup || !settings.passwordSet} maxLength={8192} placeholder={settings.passwordSet ? "Leave blank to keep the saved password" : "Paste your Google app password"} onChange={event => setPassword(event.target.value)} />
        <p>Use a <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer">Google app password</a>. Google requires 2-Step Verification to create one. Changing the account or connection requires entering the app password again.</p>
        {setup && <><label htmlFor="mail-setup-key">One-time setup key</label><input id="mail-setup-key" type="password" autoComplete="off" value={setupKey} required maxLength={43} onChange={event => setSetupKey(event.target.value.trim())} /></>}
        <label htmlFor="mail-current-password">Current admin password</label><input id="mail-current-password" type="password" autoComplete="current-password" value={currentPassword} required maxLength={1024} onChange={event => setCurrentPassword(event.target.value)} />
        <button disabled={busy}>{busy ? "Checking connection…" : "Save & Send Test Email"}</button>
        <p>The test goes only to the configured admin mailbox. Settings are saved only after Gmail accepts the connection and test email. No app restart is needed.</p>
      </fieldset>
    </form>}
    {setup && <p style={{ marginTop: 24 }}><Link href="/admin/login">Return to admin sign-in →</Link></p>}
  </section>
}
