import { pageMetadata } from "@/lib/seo"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import styles from "./page.module.css"

export const metadata = pageMetadata("Terms of Service", "Emana Jewelry's terms of service — rules and guidelines for using our platform and purchasing our products.", "/terms")

export default function TermsPage() {
  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.title}>Terms of Service</h1>
          <p className={styles.effective}>Effective: January 1, 2026</p>

          <section className={styles.section}>
            <h2 className={styles.h2}>1. Acceptance of Terms</h2>
            <p>By accessing or using Emana Jewelry&apos;s website and services, you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.h2}>2. Services Overview</h2>
            <p>Emana Jewelry makes custom jewelry, sources gemstones, and offers cleaning, repairs, and appointments. We agree on each custom order with you before starting, depending on the materials available.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.h2}>3. Quote-Based Pricing</h2>
            <p>All prices displayed on our platform are for reference and informational purposes. Final pricing is determined on a per-item basis through direct consultation and quotation. Prices may vary based on material costs, customization complexity, and market conditions. No purchase is complete until a formal quotation has been provided and accepted by both parties.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.h2}>4. Orders & Payments</h2>
            <ul className={styles.list}>
              <li>Orders are initiated through our website, via WhatsApp, or through direct consultation.</li>
              <li>Payment terms will be specified in the individual quotation.</li>
              <li>Title to products passes to the customer upon full payment.</li>
              <li>We reserve the right to refuse or cancel any order at our discretion.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.h2}>5. Custom Design & Consultations</h2>
            <ul className={styles.list}>
              <li>Custom design requests are subject to a design consultation process.</li>
              <li>Design specifications provided by the customer must be accurate and complete.</li>
              <li>Emana Jewelry retains the right to use completed designs for portfolio and marketing purposes unless otherwise agreed in writing.</li>
              <li>Consultation fees, if applicable, will be disclosed upfront.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.h2}>6. Intellectual Property</h2>
            <p>All content on this website — including text, images, logos, designs, and product representations — is the property of Emana Jewelry unless otherwise stated. You may not reproduce, distribute, or use our content without prior written permission.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.h2}>7. Limitation of Liability</h2>
            <p>Emana Jewelry shall not be liable for any indirect, incidental, or consequential damages arising from the use of our platform or products. Our total liability is limited to the amount paid for the specific product or service giving rise to the claim.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.h2}>8. Shipping & Returns</h2>
            <ul className={styles.list}>
              <li>Shipping timelines and costs will be communicated at the time of quotation.</li>
              <li>Risk of loss passes to the customer upon delivery to the carrier.</li>
              <li>Returns and exchanges are handled on a case-by-case basis. Custom pieces are generally non-returnable unless defective.</li>
              <li>Damage claims must be reported within 48 hours of delivery.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.h2}>9. Prohibited Uses</h2>
            <p>You agree not to:</p>
            <ul className={styles.list}>
              <li>Use our platform for any unlawful purpose.</li>
              <li>Attempt to manipulate pricing, orders, or inventory.</li>
              <li>Interfere with the security or functionality of our website.</li>
              <li>Submit false or misleading information.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.h2}>10. Termination</h2>
            <p>We reserve the right to suspend or terminate access to our platform for any violation of these terms, without prior notice.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.h2}>11. Governing Law</h2>
            <p>These terms are governed by the laws of the Republic of Ghana. Any disputes shall be resolved in the courts of Takoradi, Ghana.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.h2}>12. Changes to Terms</h2>
            <p>We may revise these terms at any time. Continued use of our platform after changes constitutes acceptance of the updated terms.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.h2}>13. Contact</h2>
            <p>For questions about these terms, please contact us:</p>
            <ul className={styles.list}>
              <li>Email: <a href="mailto:emanagold6590@gmail.com" className={styles.link}>emanagold6590@gmail.com</a></li>
              <li>WhatsApp: <a href="https://wa.me/233242186590" className={styles.link}>+233 24 218 6590</a></li>
              <li>Location: Takoradi, Ghana</li>
            </ul>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
