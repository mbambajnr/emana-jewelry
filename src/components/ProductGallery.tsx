"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { photosForMetal, type MetalOption } from "@/lib/product-options"
import { youtubeVideoId } from "@/lib/product-media"
import styles from "./ProductGallery.module.css"

interface GalleryProps {
  name: string
  images: { url: string; alt?: string | null; metal?: string | null; sortOrder: number }[]
  youtubeUrl?: string | null
  metal?: MetalOption
}

export default function ProductGallery(props: GalleryProps) {
  return <Gallery key={props.metal || "all"} {...props} />
}

function Gallery({ name, images, youtubeUrl, metal }: GalleryProps) {
  const photos = photosForMetal(images, metal)
  const missingVersion = metal && !images.some(image => image.url && image.metal === metal)
  const [selected, setSelected] = useState(0)
  const [video, setVideo] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [failedImages, setFailedImages] = useState<string[]>([])
  const dialogRef = useRef<HTMLDialogElement>(null)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const videoId = youtubeVideoId(youtubeUrl)
  const photo = photos[selected]
  const source = photo?.url && !failedImages.includes(photo.url) ? photo.url : "/hero_bg.png"
  const photoAlt = photo?.alt || `${name} — photo ${selected + 1}`

  useEffect(() => {
    if (!expanded) return
    const dialog = dialogRef.current
    const focused = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    dialog?.showModal()
    document.body.style.overflow = "hidden"
    return () => { dialog?.close(); document.body.style.overflow = previousOverflow; focused?.focus() }
  }, [expanded])

  const move = (direction: number) => { setSelected(current => (current + direction + photos.length) % photos.length); setVideo(false); setPlaying(false) }
  const selectPhoto = (index: number) => { setSelected(index); setVideo(false); setPlaying(false) }

  return <section className={styles.gallery} aria-label={`${name} photos and video`}>
    {missingVersion && <p className={styles.versionNotice} role="status">{photos.length ? `Reference photos only. Please ask us to confirm the ${metal} option before ordering.` : `Please ask us for a photo of the ${metal} version.`}</p>}
    <div className={styles.thumbnails} aria-label="Choose a photo or video">
      {photos.map((image, index) => <button type="button" key={`${image.url}-${index}`} className={`${styles.thumbnail} ${!video && index === selected ? styles.selected : ""}`} aria-label={`View photo ${index + 1} of ${name}`} aria-pressed={!video && index === selected} onClick={() => selectPhoto(index)}>
        <Image src={failedImages.includes(image.url) ? "/hero_bg.png" : image.url} alt="" fill sizes="64px" className={styles.thumbnailImage} />
      </button>)}
      {videoId && <button type="button" className={`${styles.thumbnail} ${styles.videoThumb} ${video ? styles.selected : ""}`} aria-pressed={video} onClick={() => { setVideo(true); setPlaying(false) }} aria-label={`Watch video of ${name}`}><span aria-hidden="true">▷</span><small>Video</small></button>}
    </div>
    <div className={styles.stageColumn}>
      <div className={styles.stage}>
        {video && videoId ? playing ? <div className={styles.videoFrame}><iframe title={`${name} product video`} src={`https://www.youtube-nocookie.com/embed/${videoId}?playsinline=1&rel=0&autoplay=1`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /><a href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noreferrer">Video not loading? Watch on YouTube ↗</a></div> : <button className={styles.videoPoster} onClick={() => setPlaying(true)} aria-label={`Play video of ${name}`}><span className={styles.playIcon} aria-hidden="true">▷</span><strong>See this piece in motion</strong><span>Tap to load and play the YouTube video</span></button> : <button type="button" disabled={!photo} className={styles.photoButton} aria-label={`Enlarge photo ${selected + 1} of ${name}`} onClick={() => setExpanded(true)} onTouchStart={event => { touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY } }} onTouchEnd={event => {
          const start = touchStart.current
          touchStart.current = null
          if (!start || photos.length < 2) return
          const dx = event.changedTouches[0].clientX - start.x, dy = event.changedTouches[0].clientY - start.y
          if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) { event.preventDefault(); move(dx < 0 ? 1 : -1) }
        }}>{photo ? <Image src={source} alt={photoAlt} fill sizes="(max-width: 767px) 100vw, (max-width: 1199px) 55vw, 45vw" className={styles.mainPhoto} preload onError={() => { if (photo?.url) setFailedImages(current => [...current, photo.url]) }} /> : <span>No {metal ? `${metal} ` : ""}photo available yet</span>}</button>}
        {!video && photos.length > 1 && <div className={styles.arrows}><button type="button" aria-label="Previous photo" onClick={() => move(-1)}>‹</button><button type="button" aria-label="Next photo" onClick={() => move(1)}>›</button></div>}
      </div>
      <p className={styles.caption} aria-live="polite">{video ? "Product video · YouTube" : `${photos.length ? `${selected + 1} of ${photos.length}` : "Photo coming soon"} · Tap the photo for a closer look`}</p>
    </div>
    {expanded && <dialog ref={dialogRef} className={styles.lightbox} aria-label={`${name} enlarged photos`} onCancel={() => setExpanded(false)} onClose={() => setExpanded(false)} onKeyDown={event => { if (photos.length > 1 && event.key === "ArrowRight") move(1); if (photos.length > 1 && event.key === "ArrowLeft") move(-1) }}>
      <div className={styles.lightboxHeader}><span>{name} · {selected + 1} / {Math.max(photos.length, 1)}</span><button type="button" onClick={() => setExpanded(false)} autoFocus aria-label="Close enlarged photo">✕</button></div>
      <div className={styles.expandedImage}><Image src={source} alt={photoAlt} fill sizes="90vw" className={styles.mainPhoto} /></div>
      {photos.length > 1 && <div className={styles.lightboxActions}><button onClick={() => move(-1)}>← Previous</button><button onClick={() => move(1)}>Next →</button></div>}
    </dialog>}
  </section>
}
