"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import { contentFields, type ServiceContent, type SiteDocument } from "@/lib/site-content"
import { servicePageText, servicePath } from "@/lib/service-pages"
import styles from "./ContentEditor.module.css"
interface Revision { id: string; action: string; actor: string; createdAt: string }
export default function ContentEditor() {
  const [document, setDocument] = useState<SiteDocument | null>(null)
  const [version, setVersion] = useState(0)
  const [revisions, setRevisions] = useState<Revision[]>([])
  const [newServiceId, setNewServiceId] = useState<string | null>(null)
  const requestedTab = useSearchParams()?.get("tab")
  const [tab, setTab] = useState(requestedTab && ["content", "services", "faqs", "history"].includes(requestedTab) ? requestedTab : "content")
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  async function load() {
    setError("")
    try {
      const response = await fetch("/api/admin/content", { cache: "no-store" })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setDocument(data.draft); setVersion(data.version); setRevisions(data.revisions); setDirty(false)
    } catch (error) { setError(error instanceof Error ? error.message : "Content could not be loaded.") }
  }
  useEffect(() => { const timer = setTimeout(() => { void load() }, 0); return () => clearTimeout(timer) }, [])
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = "" }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])
  const change = (next: SiteDocument) => { setDocument(next); setDirty(true); setMessage(""); setError("") }
  async function save(action: "save" | "publish" | "restore", revisionId?: string) {
    setBusy(true); setError(""); setMessage("")
    try {
      const response = await fetch("/api/admin/content", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, version, ...(action === "save" ? { content: document } : {}), revisionId }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setDocument(data.draft); setVersion(data.version); setDirty(false); setMessage(data.message)
      const history = await fetch("/api/admin/content", { cache: "no-store" })
      if (history.ok) setRevisions((await history.json()).revisions)
    } catch (error) { setError(error instanceof Error ? error.message : "Your changes could not be saved.") }
    finally { setBusy(false) }
  }
  async function upload(key: string, file: File) {
    setBusy(true); setError("")
    try {
      const body = new FormData(); body.set("file", file)
      const response = await fetch("/api/admin/upload", { method: "POST", body })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setDocument(previous => previous ? { ...previous, copy: { ...previous.copy, [key]: data.url } } : previous)
      setDirty(true); setMessage("")
    } catch (error) { setError(error instanceof Error ? error.message : "The image could not be uploaded.") }
    finally { setBusy(false) }
  }
  if (!document) return <section className={styles.editor}><h1>Website Content</h1>{error ? <><p role="alert">{error}</p><button onClick={load}>Try again</button></> : <p role="status">Loading website content…</p>}</section>
  const groups = [...new Set(contentFields.map(field => field.group))].filter(group => group !== "Services section")
  const editService = (id: string, update: Partial<ServiceContent>) => change({ ...document, services: document.services.map(service => service.id === id ? { ...service, ...update } : service) })
  const move = (index: number, direction: number) => {
    const services = [...document.services], target = index + direction
    if (target < 0 || target >= services.length) return
    ;[services[index], services[target]] = [services[target], services[index]]
    change({ ...document, services })
  }
  const renderFields = (group: string) => contentFields.filter(field => field.group === group).map(field => {
    const id = `cms-${field.key}`
    return <div key={field.key} className={styles.field}>
      <label htmlFor={id}>{field.label}</label>
      {field.type === "youtube" && <small>Paste a YouTube watch, Shorts, or share link. Save, preview, then publish. Leave blank to hide the video section.</small>}
      {field.type === "text" ? <textarea id={id} rows={4} value={document.copy[field.key]} onChange={event => change({ ...document, copy: { ...document.copy, [field.key]: event.target.value } })} /> : <input id={id} value={document.copy[field.key]} onChange={event => change({ ...document, copy: { ...document.copy, [field.key]: event.target.value } })} />}
      {field.type === "image" && <>
        <span>Upload or replace this image</span>
        <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" aria-label={`Upload ${field.label}`} onChange={event => { const file = event.target.files?.[0]; if (file) void upload(field.key, file); event.target.value = "" }} />
        <Image src={document.copy[field.key]} alt={`${field.label} preview`} width={320} height={180} unoptimized className={styles.image} />
      </>}
    </div>
  })
  return <section className={styles.editor}>
    <header><h1>Website Content</h1><p>Update the website, add services, and keep your FAQs current. Save a draft, preview it, then publish when you’re ready.</p></header>
    <div className={styles.toolbar}>
      <span>{dirty ? "Unsaved changes" : "Draft saved"}</span>
      <button disabled={busy || !dirty} onClick={() => save("save")}>Save Draft</button>
      {!dirty && <Link href="/admin/content/preview" target="_blank">Preview Draft ↗</Link>}
      <button className={styles.primary} disabled={busy || dirty} onClick={() => save("publish")}>{busy ? "Please wait…" : "Publish Changes"}</button>
    </div>
    {error && <p role="alert" className={styles.error}>{error} Your edits are still here.</p>}
    {message && <p role="status" className={styles.notice}>{message}</p>}
    <nav className={styles.tabs} aria-label="Content sections">{[["content", "Page Content"], ["services", "Services"], ["faqs", "FAQs"], ["history", "Revision History"]].map(([value, label]) => <button key={value} aria-pressed={tab === value} onClick={() => setTab(value)}>{label}</button>)}</nav>
    <fieldset className={styles.body} disabled={busy}>
    {tab === "content" && groups.map(group => <details key={group} className={styles.card}><summary>{group}</summary><div className={styles.fields}>{renderFields(group)}</div></details>)}
    {tab === "services" && <>
      <section className={styles.card} aria-labelledby="services-section-editor">
        <h2 id="services-section-editor">Homepage services section</h2>
        <p>Edit the “Cleaning & Repairs” heading, introduction, and large photo shown on your homepage.</p>
        <div className={styles.fields}>{renderFields("Services section")}</div>
      </section>
      <h2>Individual services</h2>
      <p>Enabled services can appear on the homepage, in appointment choices, or both. Turn a service off to stop new requests without changing past appointments.</p>
      <button onClick={() => { const id = `service-${crypto.randomUUID()}`; setNewServiceId(id); change({ ...document, services: [...document.services, { id, title: "New Service", description: "", duration: 30, enabled: true, showOnHomepage: true, bookable: true, kind: "care" }] }) }} disabled={document.services.length >= 40}>+ Add Service</button>
      {document.services.map((service, index) => <details key={service.id} className={styles.card} open={newServiceId === service.id || undefined}><summary>{service.title}{!service.enabled ? " · Hidden" : ""}</summary><div className={styles.fields}>
        <label className={styles.field}>Service name<input value={service.title} onChange={event => editService(service.id, { title: event.target.value })} /></label>
        <label className={styles.field}>Description<textarea rows={4} value={service.description} onChange={event => editService(service.id, { description: event.target.value })} /></label>
        <label className={styles.field}>Service page details<textarea rows={8} maxLength={6000} value={service.pageText ?? servicePageText(service)} onChange={event => editService(service.id, { pageText: event.target.value })} /></label>
        <p>Published, enabled services have a page at <code>{servicePath(service.id)}</code>. Use the description for the summary and these details to explain the service. Turning a service off removes its public page.</p>
        <label className={styles.field}>Appointment duration (minutes)<input type="number" min={5} max={480} value={service.duration} onChange={event => editService(service.id, { duration: Number(event.target.value) })} /></label>
        <label className={styles.field}>Service type<select value={service.kind} onChange={event => editService(service.id, { kind: event.target.value as ServiceContent["kind"] })}><option value="care">Cleaning or repairs</option><option value="custom">Custom designs</option><option value="advice">Advice or consultation</option></select></label>
        <div className={styles.switches}>{[["enabled", "Enabled"], ["showOnHomepage", "Show on homepage"], ["bookable", "Allow appointments"]].map(([key, label]) => <label key={key}><input type="checkbox" checked={Boolean(service[key as keyof ServiceContent])} onChange={event => editService(service.id, { [key]: event.target.checked })} />{label}</label>)}</div>
        <div className={styles.row}><button onClick={() => change({ ...document, services: document.services.filter(item => item.id !== service.id) })}>Remove from draft</button><button disabled={index === 0} onClick={() => move(index, -1)}>Move up</button><button disabled={index === document.services.length - 1} onClick={() => move(index, 1)}>Move down</button></div>
      </div></details>)}
    </>}
    {tab === "faqs" && <>
      <button disabled={document.faqs.length >= 40} onClick={() => change({ ...document, faqs: [...document.faqs, { q: "", a: "" }] })}>+ Add Question</button>
      {document.faqs.map((faq, index) => <div key={index} className={styles.card}><label className={styles.field}>Question<input value={faq.q} onChange={event => change({ ...document, faqs: document.faqs.map((item, i) => i === index ? { ...item, q: event.target.value } : item) })} /></label><label className={styles.field}>Answer<textarea rows={4} value={faq.a} onChange={event => change({ ...document, faqs: document.faqs.map((item, i) => i === index ? { ...item, a: event.target.value } : item) })} /></label><button onClick={() => change({ ...document, faqs: document.faqs.filter((_, i) => i !== index) })}>Remove question</button></div>)}
    </>}
    {tab === "history" && <><p>Restoring puts the earlier version into your draft. It won’t change the live website until you publish it.</p>{revisions.length === 0 && <p>No saved revisions yet.</p>}{revisions.map(revision => <div key={revision.id} className={styles.card}><p>{revision.action} · {new Date(revision.createdAt).toLocaleString("en-GB", { timeZone: "Africa/Accra" })}</p><p>{revision.actor}</p><button disabled={dirty} onClick={() => save("restore", revision.id)}>Restore as Draft</button></div>)}</>}
    </fieldset>
  </section>
}
