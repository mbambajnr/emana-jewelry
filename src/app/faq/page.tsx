import Link from "next/link"
import { buyingGuidance, publicFaqs } from "@/lib/buying-guidance"
import { Suspense } from "react"
import { publishedContent } from "@/lib/content-store"
import { jsonLdString } from "@/lib/seo"
import { pageMetadata } from "@/lib/seo"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import styles from "./page.module.css"

export const metadata = pageMetadata("Frequently Asked Questions", "Answers to common questions about Emana Jewelry — ordering, custom design, pricing, shipping, and more.", "/faq")

async function FAQContent() {
  const document = await publishedContent()
  const guides = buyingGuidance(document.copy), faqs = publicFaqs(document)
  const answers = [...guides, ...faqs].filter((faq, index, all) => all.findIndex(item => item.q === faq.q) === index)
  return (
    <div className={styles.page}>
      <Header />
      {answers.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: answers.map(faq => ({ "@type": "Question", name: faq.q, acceptedAnswer: { "@type": "Answer", text: faq.a } })) }) }} />}
      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.title}>Frequently Asked Questions</h1>

          <section className={styles.guidance} aria-labelledby="buying-guide"><h2 id="buying-guide">Before you enquire</h2>{guides.map(faq => <div key={faq.q}><h3>{faq.q}</h3><p>{faq.a}</p></div>)}<p><Link href="/catalog">Browse all jewelry</Link> · <Link href="/services">Explore our services</Link> · <Link href="/#atelier-location">Find our shop</Link></p></section>
          <h2>More questions</h2>
          <div className={styles.list}>
            {faqs.map((faq, i) => (
              <details key={i} className={styles.item}>
                <summary className={styles.question}>{faq.q}</summary>
                <p className={styles.answer}>{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function FAQPage() { return <Suspense fallback={<p role="status">Loading questions…</p>}><FAQContent /></Suspense> }
