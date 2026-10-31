import RecentlyViewed from "@/components/RecentlyViewed"
import WebsiteOffer from "@/components/WebsiteOffer"
import CatalogContinuity from "@/components/CatalogContinuity"
import { catalogQuery, catalogHref, type CatalogSearchParams } from "@/lib/catalog-navigation"
import { Suspense } from "react"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import CatalogGrid from "@/components/CatalogGrid"
import { pageMetadata } from "@/lib/seo"
import styles from "./catalog.module.css"

export async function generateMetadata({ searchParams }: { searchParams: Promise<CatalogSearchParams> }) {
  const { category, page, q, metal, sort } = catalogQuery(await searchParams)
  const metadata = pageMetadata(page > 1 ? `Browse Jewelry — Page ${page}` : "Browse All Jewelry", "Browse Emana’s jewelry, shop by category, and enquire directly on WhatsApp.", catalogHref(category, page, q, metal, sort))
  return { ...metadata, robots: { index: !q && !metal && sort === "newest", follow: true } }
}
export default function CatalogPage({ searchParams }: { searchParams: Promise<CatalogSearchParams> }) {
  return <><Header /><main className={styles.container}>
    <header className={styles.heading}><div><span className={styles.eyebrow}>THE EMANA CATALOG</span><h1>Find a piece you love.</h1><p>All our jewelry, together. Take a look around.</p></div></header>
    <WebsiteOffer compact />
    <Suspense fallback={<p role="status">Loading all our pieces…</p>}><CatalogContinuity><CatalogGrid searchParams={searchParams} /></CatalogContinuity></Suspense>
    <RecentlyViewed />
  </main><Footer /></>
}
