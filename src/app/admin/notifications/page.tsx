import { Suspense } from "react"
import { requireAdmin } from "@/lib/auth"
import DeliveryList from "./delivery-list"
async function Content() { await requireAdmin(); return <DeliveryList /> }
export default function NotificationsPage() {
  return <><h1>Email delivery</h1><p>Requests are saved before email is sent. Check pending or failed messages here and retry them after correcting the email connection. “Sent” means the email provider accepted the message; it is not an inbox delivery receipt.</p><Suspense fallback={<p>Loading delivery records…</p>}><Content /></Suspense></>
}
