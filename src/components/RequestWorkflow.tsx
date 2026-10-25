"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { requestStages, type RequestKind } from "@/lib/request-stages"

interface Activity { id: string; fromStatus: string; toStatus: string; note: string; actor: string; createdAt: string }
export default function RequestWorkflow({ kind, id, status }: { kind: RequestKind; id: string; status: string }) {
  const router = useRouter()
  const [stage, setStage] = useState(status)
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [history, setHistory] = useState<Activity[] | null>(null)
  const endpoint = `/api/admin/requests/${kind}/${id}`
  async function save() {
    setBusy(true); setError(""); setMessage("")
    try {
      const response = await fetch(endpoint, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: stage, previous: status, note }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setNote(""); setHistory(null); setMessage("Saved"); router.refresh()
    } catch (error) { setError(error instanceof Error ? error.message : "Please try again.") }
    finally { setBusy(false) }
  }
  async function loadHistory() {
    setError("")
    try {
      const response = await fetch(endpoint)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setHistory(data)
    } catch (error) { setError(error instanceof Error ? error.message : "Could not load activity.") }
  }
  return <details style={{ minWidth: 200, maxWidth: 300 }}><summary style={{ cursor: "pointer", padding: "12px 0", textTransform: "capitalize" }}>{status} · Manage</summary>
    <label>Stage<select aria-label="Request stage" value={stage} disabled={busy} onChange={event => setStage(event.target.value)} style={{ display: "block", width: "100%", minHeight: 44, marginBlock: 8 }}>{!requestStages[kind].some(value => value === status) && <option value={status}>{status}</option>}{requestStages[kind].map(value => <option key={value}>{value}</option>)}</select></label>
    <label>Internal note<textarea value={note} disabled={busy} onChange={event => setNote(event.target.value)} maxLength={2000} style={{ width: "100%", display: "block", padding: 8, marginBlock: 8 }} /></label>
    <button disabled={busy || (stage === status && !note.trim())} onClick={save} style={{ minHeight: 44, padding: "8px 16px" }}>{busy ? "Saving…" : "Save"}</button>{" "}<button onClick={loadHistory} style={{ minHeight: 44 }}>View activity</button>
    {error && <p role="alert" style={{ color: "#9b1c1c" }}>{error}</p>}{message && <p role="status">{message}</p>}
    {history && <ul style={{ paddingLeft: 18 }}>{history.length ? history.map(item => <li key={item.id} style={{ marginBlock: 12 }}><strong>{item.fromStatus} → {item.toStatus}</strong><p>{item.note}</p><small>{new Date(item.createdAt).toLocaleString("en-GB", { timeZone: "Africa/Accra" })} · {item.actor}</small></li>) : <li>No recorded changes yet.</li>}</ul>}
  </details>
}
