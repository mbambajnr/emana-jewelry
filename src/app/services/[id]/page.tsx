import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { publishedContent } from "@/lib/content-store"
import { absoluteUrl, businessSchema, jsonLdString, pageMetadata } from "@/lib/seo"
import { publicServices, servicePageText, servicePath } from "@/lib/service-pages"
import { CONCIERGE_PHONE } from "@/lib/concierge"
import styles from "../services.module.css"

type Props = { params: Promise<{ id: string }> }
export async function generateMetadata({ params }: Props) {
  const { id } = await params, { services } = await publishedContent()
  const service = publicServices(services).find(service => service.id === id)
  return service ? pageMetadata(`${service.title} in Takoradi`, service.description.slice(0, 160), servicePath(service.id)) : { title: "Service not found", robots: { index: false, follow: true } }
}
async function ServiceContent({ params }: Props) {
  const { id } = await params, { services } = await publishedContent()
  const service = publicServices(services).find(service => service.id === id)
  if (!service) notFound()
  const url = absoluteUrl(servicePath(service.id))
  const schema = { "@context": "https://schema.org", "@graph": [
    { "@type": "Service", "@id": `${url}#service`, name: service.title, description: service.description, url, serviceType: service.title, areaServed: { "@type": "City", name: "Takoradi" }, provider: { "@id": businessSchema["@id"], "@type": "JewelryStore", name: businessSchema.name, address: businessSchema.address, telephone: businessSchema.telephone, url: businessSchema.url } },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") }, { "@type": "ListItem", position: 2, name: "Services", item: absoluteUrl("/services") }, { "@type": "ListItem", position: 3, name: service.title, item: url }] },
  ] }
  const whatsapp = `https://wa.me/${CONCIERGE_PHONE}?text=${encodeURIComponent(`Hello Emana, I’m interested in ${service.title}. Please, what would it cost? ${url}`)}`
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(schema) }} />
    <nav className={styles.breadcrumbs} aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/services">Services</Link><span aria-hidden="true">/</span><span aria-current="page">{service.title}</span></nav>
    <header className={styles.intro}><h1>{service.title} in Takoradi</h1><p>{service.description}</p></header>
    <div className={styles.body}><h2>How we can help</h2>{servicePageText(service).split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
      <h2>Price and timing</h2><p>Contact us about your piece for a quote. The work, materials, and condition affect the cost and timing. Let us know if you need it for a particular date.</p>
      <div className={styles.actions}><a href={whatsapp} target="_blank" rel="noreferrer">Ask about this service</a>{service.bookable && <Link href="/#consultation">Arrange a visit or call</Link>}</div>
      <h2>Visit our Takoradi shop</h2><p>Emana Jewelry, Justmoh Ave, Takoradi, Western Region, Ghana. Contact us to confirm a suitable time before coming.</p><Link href="/#atelier-location">Find our shop and directions →</Link>
      <h2>More from Emana</h2><p><Link href="/services">All services</Link> · <Link href="/catalog">Browse jewelry</Link> · <Link href="/faq">Common questions</Link></p>
    </div></>
}
export default function ServicePage(props: Props) {
  return <><Header /><main className={styles.main}><Suspense fallback={<p role="status">Loading service details…</p>}><ServiceContent {...props} /></Suspense></main><Footer /></>
}
