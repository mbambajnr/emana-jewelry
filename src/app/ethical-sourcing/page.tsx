import { pageMetadata } from "@/lib/seo"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import styles from "./page.module.css"

export const metadata = pageMetadata("Ethical Sourcing Policy", "Emana Jewelry's commitment to ethical sourcing — responsible gemstone procurement, conflict-free materials, and sustainable practices.", "/ethical-sourcing")

export default function EthicalSourcingPage() {
  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.title}>Ethical Sourcing Policy</h1>
          <p className={styles.effective}>Effective: January 1, 2026</p>

          <section className={styles.section}>
            <h2 className={styles.h2}>Our Commitment</h2>
            <p>At Emana Jewelry, we believe that beauty should never come at the cost of human rights or environmental degradation. We are committed to sourcing all materials — including gemstones, precious metals, and diamonds — in a responsible, ethical, and sustainable manner. This policy outlines the principles and practices that guide our sourcing decisions.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.h2}>1. Conflict-Free Guarantee</h2>
            <p>We strictly prohibit the use of conflict diamonds and gemstones that finance violence, human rights abuses, or armed conflict. All our diamond suppliers comply with the Kimberley Process Certification Scheme (KPCS), and we go beyond compliance by conducting additional due diligence on our supply chain.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.h2}>2. Responsible Gemstone Sourcing</h2>
            <p>We prioritize gemstones sourced from mines and suppliers that demonstrate:</p>
            <ul className={styles.list}>
              <li>Fair labor practices and safe working conditions.</li>
              <li>Environmental responsibility, including land rehabilitation and waste management.</li>
              <li>Community engagement and fair benefit-sharing with local populations.</li>
              <li>Traceability — we maintain records of the origin of our gemstones whenever possible.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.h2}>3. Precious Metals</h2>
            <p>Our gold and precious metals are sourced from refiners who adhere to the Responsible Jewellery Council (RJC) standards. We prioritize recycled and responsibly mined metals to reduce environmental impact and support sustainable mining practices.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.h2}>4. Supplier Standards</h2>
            <p>All our suppliers must agree to:</p>
            <ul className={styles.list}>
              <li>Comply with all applicable laws and regulations in their countries of operation.</li>
              <li>Prohibit child labor, forced labor, and human trafficking.</li>
              <li>Provide safe and healthy working conditions.</li>
              <li>Respect freedom of association and collective bargaining rights.</li>
              <li>Maintain environmental management systems to minimize ecological impact.</li>
              <li>Disclose the geographic origin of all materials supplied to us.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.h2}>5. Environmental Responsibility</h2>
            <p>We are committed to minimizing our environmental footprint. This includes:</p>
            <ul className={styles.list}>
              <li>Preference for recycled metals and ethically sourced gemstones.</li>
              <li>Minimizing packaging waste and using sustainable materials.</li>
              <li>Reducing energy consumption in our operations.</li>
              <li>Supporting initiatives that promote sustainable mining and conservation.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.h2}>6. Transparency & Traceability</h2>
            <p>We strive to provide our customers with information about the origin of the materials used in our products. While full traceability is an ongoing industry challenge, we are committed to increasing transparency across our supply chain and sharing what we know with our customers.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.h2}>7. Continuous Improvement</h2>
            <p>We regularly review and update our ethical sourcing practices to reflect evolving industry standards, customer expectations, and regulatory requirements. We welcome feedback and collaboration to strengthen our approach.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.h2}>8. Reporting Concerns</h2>
            <p>If you have concerns about our sourcing practices or suspect a violation of this policy, please contact us:</p>
            <ul className={styles.list}>
              <li>Email: <a href="mailto:emanagold6590@gmail.com" className={styles.link}>emanagold6590@gmail.com</a></li>
              <li>WhatsApp: <a href="https://wa.me/233242186590" className={styles.link}>+233 24 218 6590</a></li>
            </ul>
            <p>All reports will be investigated promptly and confidentially.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
