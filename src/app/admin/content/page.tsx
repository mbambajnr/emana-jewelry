import { Suspense } from "react"
import { requireAdmin } from "@/lib/auth"
import ContentEditor from "@/components/cms/ContentEditor"
async function Editor() { await requireAdmin(); return <ContentEditor /> }
export default function ContentPage() { return <Suspense fallback={<p role="status">Loading content editor…</p>}><Editor /></Suspense> }
