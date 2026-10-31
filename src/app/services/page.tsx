import Link from "next/link"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { publishedContent } from "@/lib/content-store"
import { absoluteUrl, jsonLdString, pageMetadata } from "@/lib/seo"
import { publicServices, servicePath } from "@/lib/service-pages"
import styles from "./services.module.css"

export const metadata = pageMetadata("Jewelry Cleaning, Repairs & Custom Designs in Takoradi", "Explore Emana Jewelry’s services in Takoradi, Ghana. Ask about cleaning, ring sizing, repairs, custom designs, and materials before requesting a quote.", "/services")
export default async function ServicesPage() {
  const { services } = await publishedContent()
  const visible = publicServices(services)
  const schema = { "@context": "https://schema.org", "@type": "ItemList", itemListElement: visible.map((service, index) => ({ "@type": "ListItem", position: index + 1, name: service.title, url: absoluteUrl(servicePath(service.id)) })) }
  return <><Header /><main className={styles.main}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(schema) }} />
    <header className={styles.intro}><h1>Jewelry Services in Takoradi</h1><p>Need a repair, a clean, or help with a design? See how we can help, then speak with us about your piece and the cost.</p></header>
    <div className={styles.grid}>{visible.map(service => <article key={service.id} className={styles.card}><h2><Link href={servicePath(service.id)}>{service.title}</Link></h2><p>{service.description}</p><Link href={servicePath(service.id)}>See service details →</Link></article>)}</div>
    {!visible.length && <p>Please contact our shop to ask about available services.</p>}
    <p>Visit Emana Jewelry on Justmoh Ave, Takoradi, Ghana. <Link href="/#atelier-location">Find our shop and directions</Link>.</p>
  </main><Footer /></>
}
