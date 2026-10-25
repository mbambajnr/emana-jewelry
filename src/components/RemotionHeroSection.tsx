"use client"

import React from "react"
import dynamic from "next/dynamic"
import Image from "next/image"
import styles from "./remotion/RemotionHero.module.css"

const RemotionHeroPlayer = dynamic(
  () => import("./remotion/RemotionHeroPlayer"),
  {
    ssr: false,
    loading: () => (
      <div className={styles.heroWrapper}>
        <Image
          src="/hero/artisan_goldsmith.jpg"
          alt="A goldsmith at work in our Takoradi workshop"
          fill
          priority
          style={{ objectFit: "cover", filter: "brightness(0.65)" }}
        />
        <div className={styles.overlayContent}>
          <div className={styles.ctaRow}>
            <a href="/catalog" className={styles.btnPrimary}>
              Shop Jewelry
            </a>
            <a href="#custom-jewelry-form" className={styles.btnSecondary}>
              Custom Orders
            </a>
          </div>
        </div>
      </div>
    ),
  }
)

export default function RemotionHeroSection() {
  return <RemotionHeroPlayer />
}
