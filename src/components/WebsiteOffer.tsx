"use client"

import Link from "next/link"
import Image from "next/image"
import { useSiteContent } from "@/components/cms/SiteContentProvider"
import { websiteDiscount } from "@/lib/website-offer"
import styles from "./WebsiteOffer.module.css"

export default function WebsiteOffer({ compact = false }: { compact?: boolean }) {
  const { copy } = useSiteContent()
  const percent = websiteDiscount(copy)
  if (!percent) return null
  if (compact) return <aside className={styles.compact} aria-label="Website jewelry offer"><strong>{percent}% off when you order through our website</strong><p>Choose your jewelry and request a quote. We’ll apply your discount to the confirmed jewelry price. Delivery is quoted separately.</p></aside>
  return <section className={styles.banner} aria-labelledby="website-offer-heading">
    <div className={styles.visual}><Image src={copy["offer.image"]} alt={copy["offer.imageAlt"]} fill sizes="(min-width: 1400px) 660px, (min-width: 768px) 50vw, 100vw" className={styles.image} /></div>
    <div className={styles.content}>
      <span className={styles.eyebrow}>Only on our website</span>
      <h2 id="website-offer-heading">Your next piece,<br /><span>{percent}% less.</span></h2>
      <p className={styles.description}>Something for yourself. Something for someone special. Find a piece you love and enjoy {percent}% off when you order through our website.</p>
      <Link href="/catalog" className={styles.action}>Shop Jewelry <span aria-hidden="true">↗</span></Link>
      <p className={styles.terms}>Applied to your confirmed jewelry quote. Delivery is quoted separately.</p>
    </div>
  </section>
}
