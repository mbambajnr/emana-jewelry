"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import styles from "./ProductCardImage.module.css"

export default function ProductCardImage({ name, images, imageClassName, sizes }: {
  name: string
  images: { url: string; alt?: string | null }[]
  imageClassName?: string
  sizes: string
}) {
  const photos = images.filter((image, index, all) => image.url && all.findIndex(item => item.url === image.url) === index)
  const cover = photos[0]?.url || "/hero_bg.png"
  const alternate = photos[1]?.url
  const [readyUrl, setReadyUrl] = useState("")
  const [selected, setSelected] = useState(0)
  const [failedUrls, setFailedUrls] = useState<string[]>([])
  const gesture = useRef<{ x: number; y: number } | null>(null)
  const suppressClickUntil = useRef(0)
  const index = Math.min(selected, Math.max(photos.length - 1, 0))
  const photo = photos[index]
  const source = photo?.url && !failedUrls.includes(photo.url) ? photo.url : cover

  return <div className={styles.frame} data-testid="product-card-photos"
    onTouchStart={event => {
      gesture.current = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null
    }}
    onTouchCancel={() => { gesture.current = null }}
    onTouchEnd={event => {
      const start = gesture.current
      gesture.current = null
      if (!start || photos.length < 2 || !event.changedTouches[0]) return
      const dx = event.changedTouches[0].clientX - start.x
      const dy = event.changedTouches[0].clientY - start.y
      if (Math.abs(dx) < 40 || Math.abs(dx) <= Math.abs(dy)) return
      suppressClickUntil.current = Date.now() + 600
      setSelected((index + (dx < 0 ? 1 : -1) + photos.length) % photos.length)
    }}
    onClickCapture={event => {
      if (Date.now() < suppressClickUntil.current) {
        event.preventDefault()
        event.stopPropagation()
        suppressClickUntil.current = 0
      }
    }}>
    <Image src={source} alt={photo?.alt || name} fill sizes={sizes} className={`${styles.image} ${imageClassName || ""}`} onError={() => { if (photo?.url && photo.url !== cover) setFailedUrls(previous => [...previous, photo.url]) }} />
    {alternate && <Image key={alternate} src={alternate} alt="" aria-hidden="true" fill sizes={sizes} className={`${styles.image} ${styles.alternate}`} data-product-alternate={readyUrl === alternate ? "ready" : "loading"} onLoad={() => setReadyUrl(alternate)} onError={() => setReadyUrl("")} />}
    {photos.length > 1 && <div className={styles.photoIndicator} role="img" aria-label={`Photo ${index + 1} of ${photos.length}. Swipe to see more photos.`}>
      {photos.map((image, i) => <span key={image.url} className={`${styles.dot} ${i === index ? styles.activeDot : ""}`} />)}
    </div>}
  </div>
}
