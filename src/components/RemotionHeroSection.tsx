"use client"

import React from "react"
import dynamic from "next/dynamic"
import { useSiteContent } from "@/components/cms/SiteContentProvider"
import { heroImageProps } from "./remotion/hero-image-props"
import styles from "./remotion/RemotionHero.module.css"

function HeroFallback() {
  const { copy } = useSiteContent()
  const image = heroImageProps("artisan_goldsmith", copy["hero.0.image"])
  return (
      <div className={styles.heroWrapper}>
        {/* Pre-encoded responsive assets also work without a runtime image optimizer. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          {...image}
          alt="A goldsmith at work in our Takoradi workshop"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.65)" }}
        />
        <div className={styles.overlayContent}>
          <div className={styles.ctaRow}>
            <a href="/catalog" className={styles.btnPrimary}>
              {copy["heroActions.001"]}
            </a>
            <a href="#custom-jewelry-form" className={styles.btnSecondary}>
              {copy["heroActions.002"]}
            </a>
          </div>
        </div>
      </div>
    )
}

const RemotionHeroPlayer = dynamic(
  () => import("./remotion/RemotionHeroPlayer"),
  {
    ssr: false,
    loading: HeroFallback,
  }
)

export default function RemotionHeroSection() {
  const { copy } = useSiteContent()
  const image = heroImageProps("artisan_goldsmith", copy["hero.0.image"])
  return <>
    <link
      rel="preload"
      as="image"
      href={image.src}
      imageSrcSet={("srcSet" in image ? image.srcSet : undefined)}
      imageSizes={image.sizes}
      fetchPriority="high"
    />
    <RemotionHeroPlayer />
  </>
}
