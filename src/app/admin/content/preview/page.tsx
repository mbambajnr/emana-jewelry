import { Suspense } from "react"
import { requireAdmin } from "@/lib/auth"
import { readContentEditor } from "@/lib/content-store"
import { SiteContentProvider } from "@/components/cms/SiteContentProvider"
import HomeContent from "@/app/home-content"
import FeaturedProducts from "@/components/FeaturedProducts"
async function Preview() {
  await requireAdmin()
  let content
  try { content = await readContentEditor() }
  catch { return <p role="alert">We couldn’t load the preview. Check the database connection and try again.</p> }
  const { draft } = content
  return <SiteContentProvider document={draft} preview><aside style={{ padding: 20, background: "#f1e4bf", position: "relative", zIndex: 1100 }}>Draft preview · only signed-in staff can see this. Bookings are disabled here. <a href="/admin/content">Back to editor</a></aside><HomeContent featuredProducts={<Suspense fallback={<p>Loading products…</p>}><FeaturedProducts /></Suspense>} /><section style={{ padding: 24 }}><h2>Draft FAQs</h2>{draft.faqs.map((faq, index) => <details key={index}><summary>{faq.q}</summary><p>{faq.a}</p></details>)}</section></SiteContentProvider>
}
export default function ContentPreview() { return <Suspense fallback={<p role="status">Loading draft preview…</p>}><Preview /></Suspense> }
