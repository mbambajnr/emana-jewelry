"use client"

import { useEffect, useState, type FormEvent } from "react"
import Link from "next/link"
import styles from "@/app/admin/security/security.module.css"
import layout from "./EmailSettingsForm.module.css"

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
      if (!response.ok) {
        const message = body.error || "Email settings could not be saved. Please try again."
        throw new Error(message.startsWith("SMTP sign-in failed")
          ? "Gmail did not accept these details. Check the email address and create a Google App Password for that same account, then try again."
          : message.startsWith("SMTP connection or delivery failed")
            ? "We could not connect to Gmail or send the test email. Your details have been kept here. Try again shortly, or try port 587 under Advanced settings."
            : message.includes("setup key or current password")
              ? "The setup key or admin password was not accepted. Check both entries. If the key has expired, ask the site administrator for a new one."
              : message)
      }
      setPassword(""); setCurrentPassword(""); setSetupKey(""); setMessage(body.message)
      if (body.settings) setSettings(body.settings)
      if (setup) setComplete(true)
    } catch (error) { setError(error instanceof Error ? error.message : "Email settings could not be saved.") }
    finally { setBusy(false) }
  }
  return <section className={`${styles.page} ${setup ? layout.setup : ""}`}>
    <h1>{setup ? "Set up admin email" : "Email settings"}</h1>
    <p>Connect Gmail to send sign-in codes and shop notifications.</p>
    {setup && <p>Connect Gmail, send a test email, then sign in to receive your login code.</p>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {message && <div role="status" className={styles.notice}><h2 className={layout.heading}>Email settings saved</h2><p>Gmail accepted the test email. Check your admin inbox or spam folder. This test email does not contain a login code.</p>{setup && <><p>You can now sign in with your admin password and request a login code.</p><Link className={layout.continue} href="/admin/login">Continue to sign in →</Link></>}</div>}
    {loading ? <p role="status">Loading email settings…</p> : !complete && <form onSubmit={submit} className={styles.form}>
      <fieldset disabled={busy} className={layout.controls}>
        <section className={layout.step} aria-labelledby="mail-connect">
          <h2 id="mail-connect" className={layout.heading}>1. Connect your Gmail</h2>
          <div className={layout.field}><label htmlFor="mail-user">Gmail account that will send emails</label><input id="mail-user" type="email" autoComplete="off" placeholder="yourname@gmail.com" aria-describedby="mail-user-help" value={settings.username} required maxLength={254} onChange={event => setSettings({ ...settings, host: "smtp.gmail.com", username: event.target.value })} /><p id="mail-user-help">Use the Gmail or Google Workspace account you want the website to send from.</p></div>
          <div className={layout.field}><label htmlFor="mail-secret">Google App Password</label><input id="mail-secret" type="password" autoComplete="new-password" aria-describedby="mail-secret-help" value={password} required={setup || !settings.passwordSet} maxLength={8192} placeholder={settings.passwordSet ? "Leave blank to keep the saved password" : "Paste the app password from Google"} onChange={event => setPassword(event.target.value)} /><p id="mail-secret-help">This is a separate password created by Google for this website. It is different from your Gmail password, admin password and login code.</p>
          <details className={layout.help}><summary>How to get a Google App Password</summary><ol><li>Sign in to the Google account entered above.</li><li>Enable 2-Step Verification in your Google account security settings.</li><li>Open <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer">Google App Passwords (opens a new tab)</a>, create one named Emana Jewelry, then paste it here.</li></ol></details>
          {settings.passwordSet && <p>A password is already saved. Enter a new one if you change the sending account or connection.</p>}</div>
          <details className={layout.advanced}><summary>Advanced settings</summary><div className={layout.field}><label htmlFor="mail-host">SMTP server</label><input id="mail-host" value="smtp.gmail.com" readOnly /></div><div className={layout.field}><label htmlFor="mail-port">Connection</label><select id="mail-port" value={settings.port} onChange={event => setSettings({ ...settings, host: "smtp.gmail.com", port: Number(event.target.value) })}><option value={465}>Port 465 · TLS (default)</option><option value={587}>Port 587 · STARTTLS</option></select></div><div className={layout.field}><label htmlFor="mail-sender">Sender name and address (optional)</label><input id="mail-sender" placeholder="Emana Jewelry" aria-describedby="mail-sender-help" value={settings.sender} maxLength={320} onChange={event => setSettings({ ...settings, sender: event.target.value })} /><p id="mail-sender-help">Leave blank to send as Emana Jewelry using the Gmail address above. To customise it, use Name &lt;email@example.com&gt;.</p></div></details>
        </section>
        <section className={layout.step} aria-labelledby="mail-confirm"><h2 id="mail-confirm" className={layout.heading}>2. Confirm it’s you</h2>
          {setup && <div className={layout.field}><label htmlFor="mail-setup-key">One-time setup key</label><input id="mail-setup-key" type="password" autoComplete="off" aria-describedby="mail-key-help" value={setupKey} required maxLength={43} onChange={event => setSetupKey(event.target.value.trim())} /><p id="mail-key-help">Paste the key provided by the site administrator. It expires after 30 minutes and can be used once. It is not an emailed login code.</p></div>}
          <div className={layout.field}><label htmlFor="mail-current-password">Current admin password</label><input id="mail-current-password" type="password" autoComplete="current-password" aria-describedby="mail-admin-help" value={currentPassword} required maxLength={1024} onChange={event => setCurrentPassword(event.target.value)} /><p id="mail-admin-help">Use the password you normally enter on the Emana admin sign-in page.</p></div>
        </section>
        <section className={layout.step} aria-labelledby="mail-test"><h2 id="mail-test" className={layout.heading}>3. Test and save</h2><p>We’ll send a test to your configured admin mailbox. Settings are saved only after Gmail accepts it.</p><button disabled={busy}>{busy ? "Sending test email…" : "Send test email & save"}</button><p>Your app password is stored encrypted and will not be shown again.</p></section>
      </fieldset>
    </form>}
    {setup && !complete && <p className={layout.back}><Link href="/admin/login">Return to admin sign-in →</Link></p>}
  </section>
}
