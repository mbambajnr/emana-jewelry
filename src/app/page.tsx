import { Suspense } from "react"
import FeaturedProducts from "@/components/FeaturedProducts"
import HomeContent from "./home-content"
import { businessSchema, jsonLdString, pageMetadata, SITE_URL } from "@/lib/seo"

export const metadata = pageMetadata("Jewelry & Custom Designs in Takoradi, Ghana", "Explore jewelry for your style and budget in Takoradi, Ghana. Ask Emana Jewelry about custom designs, materials, gemstones, cleaning, and repairs.", "/")

export default function HomePage() {
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString({ "@context": "https://schema.org", "@graph": [businessSchema, { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: "Emana Jewelry", url: SITE_URL, publisher: { "@id": `${SITE_URL}/#business` } }] }) }} />
    <HomeContent featuredProducts={<Suspense fallback={<section id="featured-creations" style={{ padding: "56px 20px", textAlign: "center" }}><h2>Featured Jewelry</h2><p role="status">Loading our latest pieces…</p></section>}><FeaturedProducts /></Suspense>} />
  </>
}
