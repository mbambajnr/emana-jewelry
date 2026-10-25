"use client"

import ProductCardImage from "./ProductCardImage"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import type { FeaturedProduct } from "@/lib/featured-product"
import { addToCart } from "@/lib/cart"
import { isInWishlist, addToWishlist, removeFromWishlist } from "@/lib/wishlist"
import {
  buildProductInquiryConciergeMessage,
  getWhatsAppConciergeUrl,
  trackConciergeClick,
} from "@/lib/concierge"
import styles from "./ProductSnippets.module.css"

export default function ProductSnippets({ products }: { products: FeaturedProduct[] }) {
  const categories = [
    { id: "all", label: "All Jewelry" },
    ...Array.from(new Map(products.map(product => [product.category, { id: product.category, label: product.categoryName }])).values()),
  ]
  const [activeCategory, setActiveCategory] = useState("all")
  const [wishlistSlugs, setWishlistSlugs] = useState<string[]>([])
  const [addedSlug, setAddedSlug] = useState<string | null>(null)

  useEffect(() => {
    const syncWishlist = () => {
      try {
        const stored = JSON.parse(localStorage.getItem("emana_wishlist") || "[]")
        setWishlistSlugs(stored.map((i: { slug: string }) => i.slug))
      } catch {
        setWishlistSlugs([])
      }
    }
    syncWishlist()
    window.addEventListener("wishlist", syncWishlist)
    return () => window.removeEventListener("wishlist", syncWishlist)
  }, [])

  const handleWishlistToggle = (e: React.MouseEvent, p: FeaturedProduct) => {
    e.preventDefault()
    e.stopPropagation()
    if (isInWishlist(p.slug)) {
      removeFromWishlist(p.slug)
    } else {
      addToWishlist({
        slug: p.slug,
        name: p.name,
        image: p.images[0] || "/hero_bg.png",
        price: p.price,
        subcategory: p.subcategory || null,
      })
    }
  }

  const handleAddToCart = (e: React.MouseEvent, p: FeaturedProduct) => {
    e.preventDefault()
    e.stopPropagation()
    addToCart({
      slug: p.slug,
      name: p.name,
      image: p.images[0] || "/hero_bg.png",
      price: p.price,
      quantity: 1,
    })
    setAddedSlug(p.slug)
    setTimeout(() => setAddedSlug(null), 2000)
  }

  const handleWhatsAppInquiry = (e: React.MouseEvent, p: FeaturedProduct) => {
    e.stopPropagation()
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    const url = `${origin}/products/${encodeURIComponent(p.slug)}`
    const message = buildProductInquiryConciergeMessage(p.name, url)
    const href = getWhatsAppConciergeUrl(message)
    window.open(href, "_blank", "noopener,noreferrer")
    trackConciergeClick("/#featured-creations", "snippet_whatsapp_click", p.name)
  }

  // Filter products based on selected tab
  const filteredProducts = (
    activeCategory === "all"
      ? products.slice(0, 4)
      : products.filter((p) => p.category === activeCategory).slice(0, 4)
  )

  const getBadgeText = (p: FeaturedProduct, index: number) => {
    if (p.stones && p.stones.some((s) => s.certification)) return "Certified Stone"
    if (p.materials && p.materials.some((m) => m.metal.includes("Gold"))) return "Solid Gold"
    if (index === 0) return "Signature Piece"
    return "Handcrafted"
  }

  const getSpecsSummary = (p: FeaturedProduct) => {
    const metal = p.materials?.[0] ? `${p.materials[0].purity} ${p.materials[0].metal}` : null
    const stone = p.stones?.[0] ? `${p.stones[0].carat ? p.stones[0].carat + " ct " : ""}${p.stones[0].type}` : null
    return [metal, stone].filter(Boolean).join(" • ") || p.description.slice(0, 60) + "..."
  }

  return (
    <section id="featured-creations" className={styles.section}>
      <div className={styles.header}>
        <span className={styles.subtitle}>Signature Preview</span>
        <h2 className={styles.title}>Featured Jewelry</h2>
        <p className={styles.desc}>
          Discover pieces for different tastes, occasions, and budgets. Each product tells you about its materials, finish, and stones, where used.
        </p>
      </div>

      {/* Filter Tabs */}
      {products.length > 0 && <div className={styles.filterBar} aria-label="Filter jewelry by category">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`${styles.filterBtn} ${activeCategory === cat.id ? styles.filterBtnActive : ""}`}
            aria-pressed={activeCategory === cat.id}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>}

      {/* Product Snippet Cards */}
      {filteredProducts.length === 0 ? (
        <div className={styles.emptyState}>
          <h3 className={styles.emptyTitle}>New Jewelry Coming Soon</h3>
          <p className={styles.emptyDesc}>
            We’re preparing new pieces in a range of styles and materials. Speak with us on WhatsApp to find out what’s available or tell us what you have in mind.
          </p>
          <div className={styles.emptyActions}>
            <a
              href="https://wa.me/233242186590?text=Hi%20Emana%20Jewelry,%20I'd%20like%20to%20inquire%20about%20upcoming%20creations%20and%20bespoke%20pieces."
              target="_blank"
              rel="noopener noreferrer"
              className={styles.emptyWaBtn}
            >
              Chat With Us on WhatsApp
            </a>
            <Link href="/#custom-jewelry-form" className={styles.emptyBespokeBtn}>
              Custom Jewelry
            </Link>
          </div>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredProducts.map((p, index) => {
            const isFavorited = wishlistSlugs.includes(p.slug)
            const isAdded = addedSlug === p.slug

            return (
              <div key={p.slug} className={styles.card} data-product-card>
                <Link href={`/products/${encodeURIComponent(p.slug)}`} className={styles.imageContainer}>
                  <ProductCardImage name={p.name} images={p.images.map(url => ({ url }))} imageClassName={styles.productImage} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw" />
                  <span className={styles.badge}>{getBadgeText(p, index)}</span>
                  
                  <button
                    type="button"
                    className={`${styles.wishlistBtn} ${isFavorited ? styles.wishlistBtnActive : ""}`}
                    onClick={(e) => handleWishlistToggle(e, p)}
                    aria-label={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={isFavorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </button>
                </Link>

                <div className={styles.cardBody}>
                  <span className={styles.cardCategory}>
                    {p.categoryName} {p.subcategory ? `• ${p.subcategory}` : ""}
                  </span>

                  <Link href={`/products/${encodeURIComponent(p.slug)}`} className={styles.cardTitle}>
                    {p.name}
                  </Link>

                  <p className={styles.specs}>{getSpecsSummary(p)}</p>

                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.waBtn}
                      onClick={(e) => handleWhatsAppInquiry(e, p)}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Ask About This Piece
                    </button>

                    <button
                      type="button"
                      className={`${styles.cartBtn} ${isAdded ? styles.cartBtnAdded : ""}`}
                      onClick={(e) => handleAddToCart(e, p)}
                      title={isAdded ? "Added to Quote" : "Add to Quote List"}
                      aria-label={`Add ${p.name} to quote list`}
                    >
                      {isAdded ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* View Full Catalog Link */}
      <div className={styles.viewAllContainer}>
        <Link href="/catalog" className={styles.viewAllBtn}>
          View More
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </Link>
        <span className={styles.viewAllSub}>See all our jewelry in one place.</span>
      </div>
    </section>
  )
}
