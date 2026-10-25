"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { getWishlist, removeFromWishlist, type WishlistItem } from "@/lib/wishlist"
import styles from "./page.module.css"

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([])

  useEffect(() => {
    const handler = () => setItems(getWishlist())
    window.addEventListener("wishlist", handler)
    setTimeout(handler, 0)
    return () => window.removeEventListener("wishlist", handler)
  }, [])

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.title}>My Wishlist</h1>

          {items.length === 0 ? (
            <div className={styles.empty}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <p>Your wishlist is empty.</p>
              <Link href="/collections" className={styles.browseBtn}>
                Browse Collections
              </Link>
            </div>
          ) : (
            <div className={styles.grid}>
              {items.map((item) => (
                <div key={item.slug} className={styles.card}>
                  <Link href={`/products/${encodeURIComponent(item.slug)}`} className={styles.cardLink}>
                    <div className={styles.cardImageWrapper}>
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className={styles.cardImage}
                      />
                    </div>
                    <div className={styles.cardBody}>
                      {item.subcategory && (
                        <span className={styles.cardSub}>{item.subcategory}</span>
                      )}
                      <h2 className={styles.cardTitle}>{item.name}</h2>
                    </div>
                  </Link>
                  <button
                    className={styles.removeBtn}
                    onClick={() => removeFromWishlist(item.slug)}
                    aria-label={`Remove ${item.name} from wishlist`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
