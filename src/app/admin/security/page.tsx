import { Suspense } from "react"
import { requireAdmin } from "@/lib/auth"
import PasswordForm from "./password-form"

async function SecuritySettings() {
  await requireAdmin()
  return <PasswordForm />
}
export default function SecurityPage() {
  return <Suspense fallback={<p role="status">Loading security settings…</p>}><SecuritySettings /></Suspense>
}
