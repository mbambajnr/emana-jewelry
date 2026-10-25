import { pageMetadata } from "@/lib/seo"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import styles from "./page.module.css"

export const metadata = pageMetadata("Privacy Policy", "Emana Jewelry's privacy policy — how we collect, use, and protect your personal information.", "/privacy")

export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.title}>Privacy Policy</h1>
          <p className={styles.effective}>Effective: January 1, 2026</p>

          <section className={styles.section}>
            <h2 className={styles.h2}>1. Information We Collect</h2>
            <p>When you use Emana Jewelry, we may collect:</p>
            <ul className={styles.list}>
              <li><strong>Personal Information</strong> — name, email address, phone number, and shipping address when you place an order, book a consultation, or subscribe to our newsletter.</li>
              <li><strong>Order Information</strong> — product selections, custom design specifications, and transaction details.</li>
              <li><strong>Communication Data</strong> — correspondence via email or WhatsApp, including inquiries and consultation messages.</li>
              <li><strong>Usage Data</strong> — browsing behavior, pages visited, and interactions with our site, collected via cookies and similar technologies.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.h2}>2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className={styles.list}>
              <li>Process and fulfill orders, including sending order confirmations and updates.</li>
              <li>Respond to inquiries, consultation requests, and customer support needs.</li>
              <li>Send administrative emails (order notifications) and, with consent, marketing communications.</li>
              <li>Improve our website, products, and services based on usage patterns.</li>
              <li>Comply with legal obligations and prevent fraud.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.h2}>3. Data Sharing</h2>
            <p>We do not sell your personal information. We may share data with trusted third parties only as necessary to operate our business:</p>
            <ul className={styles.list}>
              <li><strong>Payment Processors</strong> — to process transactions securely.</li>
              <li><strong>Shipping Partners</strong> — to deliver your orders.</li>
              <li><strong>Email Service Providers</strong> — to send transactional and marketing emails (e.g., Resend).</li>
              <li><strong>Analytics Providers</strong> — to understand site usage and improve your experience.</li>
              <li><strong>Legal Authorities</strong> — when required by law or to protect our rights.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.h2}>4. Data Security</h2>
            <p>We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. These include encryption, secure servers, and access controls.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.h2}>5. Data Retention</h2>
            <p>We retain your personal information for as long as necessary to fulfill the purposes outlined in this policy, or as required by law. Order records are retained for a minimum of six years for tax and accounting purposes.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.h2}>6. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul className={styles.list}>
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your data (subject to legal obligations).</li>
              <li>Object to or restrict processing of your data.</li>
              <li>Withdraw consent at any time where processing is based on consent.</li>
            </ul>
            <p>To exercise these rights, contact us at <a href="mailto:emanagold6590@gmail.com" className={styles.link}>emanagold6590@gmail.com</a> or via WhatsApp at <a href="https://wa.me/233242186590" className={styles.link}>+233 24 218 6590</a>.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.h2}>7. Cookies</h2>
            <p>We use an essential cookie for admin sign-in. Your cart and wishlist are stored in your browser’s local storage. Recently viewed product references stay on this browser for up to 30 days, and you can remove them using Clear history. Your catalog page and scroll position are kept for the current browsing session so you can return to your results. These features do not require a customer account or sync across devices. You can also remove this information through your browser settings.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.h2}>8. International Transfers</h2>
            <p>Your data may be processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with applicable data protection laws.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.h2}>9. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated effective date. We encourage you to review this policy periodically.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.h2}>10. Contact</h2>
            <p>For questions or concerns about this policy, please contact us:</p>
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
