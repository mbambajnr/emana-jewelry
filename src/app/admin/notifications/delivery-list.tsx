"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
interface Job { id: string; kind: string; recordId: string; status: string; attempts: number; lastError: string | null }
export default function DeliveryList() {
  const [jobs, setJobs] = useState<Job[]>([]), [error, setError] = useState(""), [busy, setBusy] = useState<string | null>(null), [loaded, setLoaded] = useState(false)
  async function load() {
    try { const response = await fetch("/api/admin/notifications", { cache: "no-store" }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setJobs(data); setLoaded(true) }
    catch (error) { setError(error instanceof Error ? error.message : "Delivery records could not be loaded.") }
  }
  useEffect(() => { const timer = setTimeout(() => { void load() }, 0); return () => clearTimeout(timer) }, [])
  async function retry(id: string) {
    setBusy(id); setError("")
    try { const response = await fetch("/api/admin/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); await load() }
    catch (error) { setError(error instanceof Error ? error.message : "Retry failed.") }
    finally { setBusy(null) }
  }
  return <section aria-label="Email delivery records" style={{ marginTop: 24 }}>
    {error && <p role="alert">{error}</p>}
    <button type="button" onClick={() => void load()} disabled={!!busy}>Refresh delivery records</button>
    {!loaded ? !error && <p role="status">Loading…</p> : !jobs.length ? <p>No queued emails yet.</p> : <ul style={{ listStyle: "none", padding: 0 }}>{jobs.map(job => <li key={job.id} style={{ borderBottom: "1px solid var(--card-border)", padding: "20px 0", overflowWrap: "anywhere" }}>
      <strong>{job.kind === "order-owner" ? "Request notification" : job.kind === "order-customer" ? "Client confirmation" : "Appointment notification"}</strong> · <Link href={job.kind.startsWith("order-") ? "/admin/orders" : "/admin/consultations"}>#{job.recordId.slice(0, 8)}</Link>
      <p>Status: {job.status} · Attempts: {job.attempts}</p>{job.lastError && <p>{job.lastError}</p>}
      {job.status !== "sent" && <button type="button" aria-label={`Retry ${job.kind} for request ${job.recordId.slice(0, 8)}`} disabled={!!busy || job.status === "working"} onClick={() => void retry(job.id)} style={{ minHeight: 44 }}>{busy === job.id ? "Retrying…" : "Retry delivery"}</button>}
    </li>)}</ul>}
  </section>
}
