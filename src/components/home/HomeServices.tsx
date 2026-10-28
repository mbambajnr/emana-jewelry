"use client"

import Image from "next/image"
import { useSiteContent } from "@/components/cms/SiteContentProvider"
import { CONCIERGE_PHONE } from "@/lib/concierge"
import styles from "@/app/page.module.css"

export default function HomeServices() {
  const { copy, services } = useSiteContent()
  const visible = services.filter(service => service.enabled && service.showOnHomepage)
  if (!visible.length) return null
  return <section id="services" className={`${styles.section} ${styles.services}`}>
    <div className={styles.sectionHeader}>
      <span className={styles.sectionSubtitle}>{copy["services.eyebrow"]}</span>
      <h2 className={styles.sectionTitle}>{copy["services.title"]}</h2>
      <p className={styles.sectionDesc}>{copy["services.description"]}</p>
    </div>
    <div className={styles.servicesContainer}>
      <div className={styles.servicesVisual}><Image src={copy["services.image"]} alt="Jewelry care services" fill sizes="(max-width: 1200px) 100vw, 50vw" className={styles.servicesVisualImg} /></div>
      <div className={styles.servicesInfo}><div className={styles.serviceItems}>
        {visible.map(service => <div key={service.id} className={styles.serviceItem}>
          <span className={styles.serviceIcon} aria-hidden="true">✧</span>
          <div className={styles.serviceText}>
            <h3 className={styles.serviceTitle}>{service.title}</h3><p className={styles.serviceDesc}>{service.description}</p>
            <a className={styles.serviceWa} href={`https://wa.me/${CONCIERGE_PHONE}?text=${encodeURIComponent(`Hello Emana, I’d like to ask about ${service.title}. Please, how much will it cost?`)}`} target="_blank" rel="noopener noreferrer">Ask about this service →</a>
          </div>
        </div>)}
      </div></div>
    </div>
  </section>
}
