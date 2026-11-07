import { Suspense } from "react"
import { requireAdmin } from "@/lib/auth"
import EmailSettingsForm from "@/components/admin/EmailSettingsForm"
async function Settings() { await requireAdmin(); return <EmailSettingsForm /> }
export default function EmailPage() { return <Suspense fallback={<p role="status">Loading email settings…</p>}><Settings /></Suspense> }
