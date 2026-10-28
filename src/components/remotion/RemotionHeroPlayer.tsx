"use client"

import { useSiteContent } from "@/components/cms/SiteContentProvider";

import React, { useRef, useState, useEffect } from "react"
import { Player, type PlayerRef } from "@remotion/player"
import Link from "next/link"
import RemotionHeroComposition from "./RemotionHeroComposition"
import styles from "./RemotionHero.module.css"

export default function RemotionHeroPlayer() {
  const { copy } = useSiteContent();
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 375, height: 760 })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: Math.max(1, Math.round(entry.contentRect.width)), height: Math.max(1, Math.round(entry.contentRect.height)) })
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  const playerRef = useRef<PlayerRef>(null)
  const [activeScene, setActiveScene] = useState(0)

  // Track playback to update active scene indicator
  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current) {
        const frame = playerRef.current.getCurrentFrame()
        if (frame < 115) {
          setActiveScene(0)
        } else if (frame < 235) {
          setActiveScene(1)
        } else {
          setActiveScene(2)
        }
      }
    }, 250)

    return () => clearInterval(interval)
  }, [])

  const jumpToScene = (frame: number, sceneIdx: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(frame)
      setActiveScene(sceneIdx)
      if (!playerRef.current.isPlaying()) playerRef.current.play()
    }
  }

  return (
    <div className={styles.heroWrapper}>
      {/* Remotion Canvas / DOM Player */}
      <div ref={containerRef} className={styles.playerContainer}>
        <Player
          ref={playerRef}
          component={RemotionHeroComposition}
          durationInFrames={360}
          compositionWidth={size.width}
          compositionHeight={size.height}
          fps={30}
          style={{
            width: "100%",
            height: "100%",
            position: "absolute",
            inset: 0,
            objectFit: "cover",
          }}
          autoPlay
          initiallyMuted
          loop
          controls={false}
          clickToPlay={false}
        />
      </div>

      {/* Floating Interactive Controls & CTAs Overlay */}
      <div className={styles.overlayContent}>
        {/* Call to Actions */}
        <div className={styles.ctaRow}>
          <a href="/catalog" className={styles.btnPrimary}>{copy["heroActions.001"]}</a>
          <a href="#custom-jewelry-form" className={styles.btnSecondary}>{copy["heroActions.002"]}</a>
          <Link href="/#atelier-location" className={styles.btnOutline}>{copy["heroActions.003"]}</Link>
        </div>

        {/* Scene Navigation & Player Controls */}
        <div className={styles.controlsBar}>
          <div className={styles.scenePills}>
            <button
              type="button"
              className={`${styles.pill} ${activeScene === 0 ? styles.pillActive : ""}`}
              onClick={() => jumpToScene(0, 0)}
              aria-label="Scene 1: Shop jewelry"
            >
              <span className={styles.pillNum}>01</span>
              <span className={styles.pillLabel}>{copy["heroActions.004"]}</span>
            </button>

            <button
              type="button"
              className={`${styles.pill} ${activeScene === 1 ? styles.pillActive : ""}`}
              onClick={() => jumpToScene(115, 1)}
              aria-label="Scene 2: Necklaces and pendants"
            >
              <span className={styles.pillNum}>02</span>
              <span className={styles.pillLabel}>{copy["heroActions.005"]}</span>
            </button>

            <button
              type="button"
              className={`${styles.pill} ${activeScene === 2 ? styles.pillActive : ""}`}
              onClick={() => jumpToScene(235, 2)}
              aria-label="Scene 3: Emana Jewelry"
            >
              <span className={styles.pillNum}>03</span>
              <span className={styles.pillLabel}>{copy["heroActions.006"]}</span>
            </button>
          </div>


        </div>
      </div>
    </div>
  )
}
