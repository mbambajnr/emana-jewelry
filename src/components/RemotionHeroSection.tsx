"use client"

import React from "react"
import dynamic from "next/dynamic"
import heroImages from "./remotion/hero-images.json"
import styles from "./remotion/RemotionHero.module.css"

const RemotionHeroPlayer = dynamic(
  () => import("./remotion/RemotionHeroPlayer"),
  {
    ssr: false,
    loading: () => (
      <div className={styles.heroWrapper}>
        {/* Pre-encoded responsive assets also work without a runtime image optimizer. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          {...heroImages.artisan_goldsmith}
          alt="A goldsmith at work in our Takoradi workshop"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.65)" }}
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
  return <>
    <link
      rel="preload"
      as="image"
      href={heroImages.artisan_goldsmith.src}
      imageSrcSet={heroImages.artisan_goldsmith.srcSet}
      imageSizes={heroImages.artisan_goldsmith.sizes}
      fetchPriority="high"
    />
    <RemotionHeroPlayer />
  </>
}
