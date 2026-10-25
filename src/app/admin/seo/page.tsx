"use client"

import { useEffect, useState, type FormEvent } from "react"
import { SITE_URL, absoluteUrl } from "@/lib/seo"
import type { SearchVerification } from "@/lib/search-verification"
import styles from "./seo.module.css"

export default function SearchSettingsPage() {
  const [settings, setSettings] = useState<SearchVerification>({ googleVerification: "", bingVerification: "" })
  const [saved, setSaved] = useState<SearchVerification | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [local, setLocal] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const controller = new AbortController()
    fetch("/api/admin/seo", { signal: controller.signal }).then(async response => {
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setSettings(data.settings); setSaved(data.settings); setLocal(data.storage === "local")
    }).catch(error => { if (error.name !== "AbortError") setError(error.message) }).finally(() => setLoading(false))
    return () => controller.abort()
  }, [])

  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("")
    try {
      const response = await fetch("/api/admin/seo", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setSettings(data.settings); setSaved(data.settings); setMessage(data.message)
    } catch (error) { setError(error instanceof Error ? error.message : "Please try saving again.") }
    finally { setSaving(false) }
  }

  return <div className={styles.page}>
    <header><h1>Search &amp; SEO</h1><p>Help clients find Emana on Google, Bing, and AI search tools. Add your verification codes here without changing the website’s code.</p></header>
    <section className={styles.card}>
      <h2>Your website</h2><p><a href={SITE_URL} target="_blank" rel="noreferrer">{SITE_URL}</a></p>
      <p>Your sitemap: <a href={absoluteUrl("/sitemap.xml")} target="_blank" rel="noreferrer">{absoluteUrl("/sitemap.xml")}</a></p>
      <p>Use this exact website address when setting up your search accounts. If this isn’t your live domain, update the site’s domain setting before verification.</p>
      {local && <p className={styles.notice}>You’re working locally. Codes saved here stay on this computer. Add them again in the live admin area after deployment; Google and Bing cannot verify localhost.</p>}
    </section>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {message && <p role="status" className={styles.notice}>{message}</p>}
    {loading ? <p role="status">Loading your settings…</p> : <form onSubmit={save}>
      <fieldset disabled={saving || !saved} className={styles.fields}>
        <section className={styles.card}>
          <h2>Google Search Console</h2><p className={styles.status}>{saved?.googleVerification ? "Code saved · finish verification in Google" : "No code saved yet"}</p>
          <ol><li><a href="https://search.google.com/search-console" target="_blank" rel="noreferrer">Open Google Search Console</a> and add your website as a <strong>URL-prefix</strong> property.</li><li>Choose <strong>HTML tag</strong> and copy the tag Google gives you.</li><li>Paste it below and save. Then return to Google and click <strong>Verify</strong>.</li></ol>
          <label htmlFor="google-code">Google verification code or meta tag</label>
          <textarea id="google-code" rows={3} autoCapitalize="none" spellCheck={false} value={settings.googleVerification} onChange={event => { setSettings({ ...settings, googleVerification: event.target.value }); setMessage("") }} placeholder="Paste your Google verification tag here" />
          <p>If you choose a Domain property instead, Google will ask for a DNS record at your domain provider. This form handles the HTML tag method.</p>
        </section>
        <section className={styles.card}>
          <h2>Bing Webmaster Tools</h2><p className={styles.status}>{saved?.bingVerification ? "Code saved · finish verification in Bing" : "No code saved yet"}</p>
          <ol><li><a href="https://www.bing.com/webmasters" target="_blank" rel="noreferrer">Open Bing Webmaster Tools</a> and add your website.</li><li>Choose the HTML meta tag option and copy the tag named <strong>msvalidate.01</strong>.</li><li>Paste it below and save. Return to Bing to finish verification. You may also import an already verified Google property in Bing.</li></ol>
          <label htmlFor="bing-code">Bing verification code or meta tag</label>
          <textarea id="bing-code" rows={3} autoCapitalize="none" spellCheck={false} value={settings.bingVerification} onChange={event => { setSettings({ ...settings, bingVerification: event.target.value }); setMessage("") }} placeholder="Paste your Bing verification tag here" />
        </section>
        <button className={styles.save} type="submit">{saving ? "Saving…" : "Save Verification Codes"}</button>
      </fieldset>
    </form>}
    <section className={styles.card}><h2>After verification</h2><ol><li>In each search account, open <strong>Sitemaps</strong> and submit <strong>{absoluteUrl("/sitemap.xml")}</strong>.</li><li>Ask Google to inspect your homepage and request indexing.</li><li>Keep your Google Business Profile address, opening hours, and phone number up to date.</li></ol><p>Search reports and ownership status are shown in Google and Bing. Saving a code here does not connect their reporting APIs or guarantee search placement. These same crawlable pages and business details support AI search discovery.</p><p>Keep verification codes in place after verification. Clearing a field and saving removes that tag and may affect ownership verification.</p></section>
  </div>
}
