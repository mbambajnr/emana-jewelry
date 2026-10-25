"use client"

import { useEffect, useState, type FormEvent } from "react"
import { emptySocialLinks, socialPlatforms, type SocialLinks } from "@/lib/social-links"
import styles from "../seo/seo.module.css"

const names = { instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok" }
const placeholders = { instagram: "https://www.instagram.com/your-profile/", facebook: "https://www.facebook.com/your-page/", tiktok: "https://www.tiktok.com/@your-profile" }
export default function SocialSettingsPage() {
  const [links, setLinks] = useState<SocialLinks>(emptySocialLinks)
  const [loading, setLoading] = useState(true)
  const [ready, setReady] = useState(false)
  const [saving, setSaving] = useState(false)
  const [local, setLocal] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  useEffect(() => {
    const controller = new AbortController()
    fetch("/api/admin/social", { signal: controller.signal }).then(async response => {
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setLinks(data.links); setLocal(data.local); setReady(true)
    }).catch(error => { if (error.name !== "AbortError") setError(error.message) }).finally(() => setLoading(false))
    return () => controller.abort()
  }, [])
  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("")
    try {
      const response = await fetch("/api/admin/social", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(links) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setLinks(data.links); setMessage(data.message)
    } catch (error) { setError(error instanceof Error ? error.message : "Please try saving again.") }
    finally { setSaving(false) }
  }
  return <div className={styles.page}>
    <header><h1>Social Media</h1><p>Keep Emana’s Instagram, Facebook, and TikTok links up to date. Save here and the footer updates without any code changes.</p></header>
    {local && <p className={styles.notice}>You’re working locally. These links stay on this computer. Add them again in the live admin area after deployment.</p>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {message && <p role="status" className={styles.notice}>{message}</p>}
    {loading ? <p role="status">Loading your social links…</p> : <form onSubmit={save}><fieldset className={styles.fields} disabled={saving || !ready}>
      {socialPlatforms.map(platform => <section className={styles.card} key={platform}>
        <h2>{names[platform]}</h2>
        <label htmlFor={`social-${platform}`}>{names[platform]} profile link</label>
        <input id={`social-${platform}`} type="url" value={links[platform]} onChange={event => { setLinks({ ...links, [platform]: event.target.value }); setMessage("") }} placeholder={placeholders[platform]} autoCapitalize="none" autoCorrect="off" spellCheck={false} style={{ width: "100%", minHeight: 48, padding: 12, border: "1px solid #d8cebb", borderRadius: 6, fontSize: 16 }} />
        <p>Use the full https:// link to Emana’s {names[platform]} profile. Leave it blank to keep this icon inactive.</p>
      </section>)}
      <button className={styles.save} type="submit">{saving ? "Saving…" : "Save Social Links"}</button>
    </fieldset></form>}
  </div>
}
