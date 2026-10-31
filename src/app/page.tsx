import { publishedContent } from "@/lib/content-store"
import { Suspense } from "react"
import FeaturedProducts from "@/components/FeaturedProducts"
import HomeContent from "./home-content"
import { businessSchema, jsonLdString, pageMetadata, SITE_URL } from "@/lib/seo"
import { publicSocialLinks } from "@/lib/social-settings"
import { absoluteUrl } from "@/lib/seo"
import { servicePath } from "@/lib/service-pages"

export async function generateMetadata() {
  const { copy } = await publishedContent()
  return pageMetadata(copy["seo.homeTitle"], copy["seo.homeDescription"], "/")
}

export default async function HomePage() {
  const { services } = await publishedContent()
  const sameAs = Object.values(await publicSocialLinks()).filter(Boolean)
  const storeSchema = { ...businessSchema, ...(sameAs.length ? { sameAs } : {}), hasMap: "https://www.google.com/maps/search/?api=1&query=Emana+Jewelry,+Justmoh+Ave,+Takoradi,+Ghana", hasOfferCatalog: { "@type": "OfferCatalog", name: "Jewelry and Services", itemListElement: services.filter(service => service.enabled).map(service => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: service.title, description: service.description, url: absoluteUrl(servicePath(service.id)) } })) } }
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString({ "@context": "https://schema.org", "@graph": [storeSchema, { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: "Emana Jewelry", url: SITE_URL, publisher: { "@id": `${SITE_URL}/#business` } }] }) }} />
    <HomeContent featuredProducts={<Suspense fallback={<section id="featured-creations" style={{ padding: "56px 20px", textAlign: "center" }}><h2>Featured Jewelry</h2><p role="status">Loading our latest pieces…</p></section>}><FeaturedProducts /></Suspense>} />
  </>
}
