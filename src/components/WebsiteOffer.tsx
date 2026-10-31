"use client"

import Link from "next/link"
import { useSiteContent } from "@/components/cms/SiteContentProvider"
import { websiteDiscount } from "@/lib/website-offer"
import styles from "./WebsiteOffer.module.css"

export default function WebsiteOffer({ compact = false }: { compact?: boolean }) {
  const { copy } = useSiteContent()
  const percent = websiteDiscount(copy)
  if (!percent) return null
  return <aside className={compact ? styles.compact : styles.banner} aria-label="Website jewelry offer">
    <div><strong>{percent}% off when you order through our website</strong><p>Choose your jewelry and request a quote. We’ll apply your discount to the confirmed jewelry price. Delivery is quoted separately.</p></div>
    {!compact && <Link href="/catalog">Find your piece →</Link>}
  </aside>
}
