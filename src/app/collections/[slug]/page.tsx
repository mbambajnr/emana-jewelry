import ProductCardImage from "@/components/ProductCardImage"
import { absoluteUrl } from "@/lib/seo"
import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"

import { collections as staticCollections, products as staticProducts } from "@/lib/products"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  let collection: { name: string; description: string; image: string } | null = null

  try {
    collection = await prisma.category.findUnique({ where: { slug } })
  } catch {
    // Database connection refused or offline, fallback to static collections
  }

  if (!collection) {
    collection = staticCollections.find((c) => c.slug === slug) || null
  }

  if (!collection) return { title: "Collection Not Found", robots: { index: false } }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://emanajewelry.com"
  const url = `${siteUrl}/collections/${slug}`

  return {
    twitter: { card: "summary_large_image", title: collection.name, description: collection.description, images: [absoluteUrl(collection.image)] },
    title: collection.name,
    description: collection.description,
    alternates: { canonical: url },
    openGraph: {
      title: collection.name,
      description: collection.description,
      url,
      images: [{ url: absoluteUrl(collection.image), width: 1200, height: 630 }],
    },
  }
}

import Header from "@/components/Header"
import { WhatsappButton } from "@/components/WhatsappButton"
import { WishlistButton } from "@/components/WishlistButton"
import styles from "./page.module.css"

const PHONE = "233242186590"

interface CollectionDetail {
  slug: string
  name: string
  description: string
  image: string
}

interface ProductItem {
  id: string
  slug: string
  name: string
  subcategory: string | null
  price: number
  description: string
  rating: number
  reviewCount: number
  images: { url: string; sortOrder: number }[]
  stones: { type: string }[]
}

async function CollectionContent({ slug }: { slug: string }) {
  let collection: CollectionDetail | null = null
  let products: ProductItem[] = []

  try {
    const [dbCollection, dbProducts] = await Promise.all([
      prisma.category.findUnique({ where: { slug } }),
      prisma.product.findMany({
        where: { category: { slug } },
        include: {
          stones: { select: { type: true } },
          images: { orderBy: { sortOrder: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ])
    collection = dbCollection
    products = dbProducts
  } catch {
    // Database connection refused or offline, fallback to static collections
  }

  if (!collection) {
    collection = staticCollections.find((c) => c.slug === slug) || null
    if (collection) {
      products = staticProducts
        .filter((p) => p.category === slug)
        .map((p) => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          subcategory: p.subcategory || null,
          price: p.price,
          description: p.description,
          rating: p.rating,
          reviewCount: p.reviewCount,
          stones: p.stones.map(stone => ({ type: stone.type })),
          images: p.images.map((url, i) => ({ url, sortOrder: i })),
        }))
    }
  }

  if (!collection) notFound()

  const isCustom = slug === "custom"

  return (
    <>
      <section className={styles.hero}>
        <Image
          src={collection.image}
          alt={collection.name}
          fill
          className={styles.heroImage}
        />
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <Link href="/collections" className={styles.breadcrumb}>
            &larr; All Collections
          </Link>
          <h1 className={styles.heroTitle}>{collection.name}</h1>
          <p className={styles.heroDesc}>{collection.description}</p>
          {isCustom ? (
            <span className={styles.heroCount}>Made to Order</span>
          ) : (
            <span className={styles.heroCount}>
              {products.length} {products.length === 1 ? "Piece" : "Pieces"}
            </span>
          )}
        </div>
      </section>

      {isCustom ? (
        <section className={styles.customSection}>
          <div className={styles.customInner}>
            <h2 className={styles.customTitle}>Start Your Custom Piece</h2>
            <p className={styles.customDesc}>
              Every masterpiece begins with a conversation. Tell us your vision and
              we&apos;ll bring it to life — from initial sketch to final polish.
            </p>
            <div className={styles.customActions}>
              <a
                href={`https://wa.me/${PHONE}?text=${encodeURIComponent("Hi, I'd like to discuss a custom jewelry piece.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.customWaBtn}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Chat on WhatsApp
              </a>
              <Link href="/#consultation" className={styles.customEmailBtn}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Book a Consultation
              </Link>
            </div>
          </div>
        </section>
      ) : products.length === 0 ? (
        <section className={styles.gridSection}>
          <div className={styles.emptyCollection}>
            <p>No pieces in this collection yet.</p>
          </div>
        </section>
      ) : (
        <section className={styles.gridSection}>
          <div className={styles.grid}>
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${encodeURIComponent(product.slug)}`}
                className={styles.card}
                data-product-card
              >
                <div className={styles.cardImageWrapper}>
                  <ProductCardImage name={product.name} images={product.images} imageClassName={styles.cardImage} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
                  <WishlistButton
                    slug={product.slug}
                    name={product.name}
                    image={product.images[0]?.url || "/hero_bg.png"}
                    subcategory={product.subcategory}
                    className={styles.wishlistBtn}
                    iconSize={18}
                  />
                  <WhatsappButton
                    productName={product.name}
                    productUrl={`/products/${encodeURIComponent(product.slug)}`}
                    className={styles.whatsappBtn}
                    iconSize={18}
                  />
                </div>
                <div className={styles.cardBody}>
                  {product.subcategory && (
                    <span className={styles.cardSub}>{product.subcategory}</span>
                  )}
                  <h2 className={styles.cardTitle}>{product.name}</h2>
                        <div className={styles.cardFooter}>
                    <WhatsappButton
                      productName={product.name}
                      productUrl={`/products/${encodeURIComponent(product.slug)}`}
                      className={styles.requestQuoteBtn}
                      iconSize={14}
                      label="Request Quote"
                    />
                    <div className={styles.cardRating}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--gold-primary)" stroke="var(--gold-primary)" strokeWidth="1">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      <span>{product.rating}</span>
                      <span className={styles.cardReviewCount}>({product.reviewCount})</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  )
}

async function CollectionPageContent({ paramsPromise }: { paramsPromise: Promise<{ slug: string }> }) {
  const { slug } = await paramsPromise
  return <CollectionContent slug={slug} />
}

export default function CollectionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return (
    <div className={styles.page}>
      <Header />
      <Suspense
        fallback={
          <div className={styles.hero}>
            <div className={styles.heroOverlay} />
            <div className={styles.heroContent}>
              <div style={{ height: 14, width: 120, background: "rgba(255,255,255,0.1)", marginBottom: 8 }} />
              <div style={{ height: 40, width: "60%", background: "rgba(255,255,255,0.08)", marginBottom: 8 }} />
              <div style={{ height: 16, width: "80%", background: "rgba(255,255,255,0.05)" }} />
            </div>
          </div>
        }
      >
        <CollectionPageContent paramsPromise={params} />
      </Suspense>
    </div>
  )
}