import type { Metadata } from "next"
import { Suspense } from "react"
import AdminShell from "./AdminShell"
export const metadata: Metadata = { robots: { index: false, follow: false } }
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<p role="status">Loading admin…</p>}><AdminShell>{children}</AdminShell></Suspense>
}
