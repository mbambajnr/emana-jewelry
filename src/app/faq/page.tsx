import { Suspense } from "react"
import { publishedContent } from "@/lib/content-store"
import { jsonLdString } from "@/lib/seo"
import { pageMetadata } from "@/lib/seo"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import styles from "./page.module.css"

export const metadata = pageMetadata("Frequently Asked Questions", "Answers to common questions about Emana Jewelry — ordering, custom design, pricing, shipping, and more.", "/faq")

async function FAQContent() {
  const { faqs } = await publishedContent()
  return (
    <div className={styles.page}>
      <Header />
      {faqs.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(faq => ({ "@type": "Question", name: faq.q, acceptedAnswer: { "@type": "Answer", text: faq.a } })) }) }} />}
      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.title}>Frequently Asked Questions</h1>

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
