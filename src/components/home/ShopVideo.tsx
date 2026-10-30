"use client"

import { useState } from "react"
import Image from "next/image"
import { useSiteContent } from "@/components/cms/SiteContentProvider"
import { youtubeVideoId } from "@/lib/product-media"
import styles from "./ShopVideo.module.css"

export default function ShopVideo() {
  const { copy, preview } = useSiteContent()
  const id = youtubeVideoId(copy["home.video.url"])
  if (!id) return preview ? <section className={styles.section}><p>Add a YouTube link under “Shop introduction video” in Website Content to show this section.</p></section> : null
  return <Video key={id} id={id} title={copy["home.video.title"]} description={copy["home.video.description"]} poster={copy["home.video.poster"]} />
}

function Video({ id, title, description, poster }: { id: string; title: string; description: string; poster: string }) {
  const [playing, setPlaying] = useState(false)
  return <section id="meet-emana" className={styles.section} aria-labelledby="shop-video-heading">
    <div className={styles.inner}>
      <header className={styles.heading}><h2 id="shop-video-heading">{title}</h2><p>{description}</p></header>
      <div className={styles.frame}>
        {playing ? <iframe title={title} src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /> : <button type="button" className={styles.poster} onClick={() => setPlaying(true)} aria-label={`Watch ${title}`}>
          <Image src={poster} alt="" fill sizes="(min-width: 1100px) 1000px, 92vw" className={styles.image} />
          <span className={styles.overlay} />
          <span className={styles.play} aria-hidden="true">▶</span>
          <span className={styles.label}>Watch our shop introduction</span>
        </button>}
      </div>
      <p className={styles.note}>{playing ? "" : "Plays on YouTube when you press play. "}<a href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noreferrer">Watch on YouTube ↗</a></p>
    </div>
  </section>
}
