import { pageMetadata } from "@/lib/seo"

export const metadata = pageMetadata("Jewelry Collections in Ghana", "Explore rings, necklaces, earrings, bracelets, wedding sets, and custom jewelry in a range of materials from Emana Jewelry in Takoradi. Ask us for a quote.", "/collections")

import { Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { prisma } from "@/lib/db"

import Header from "@/components/Header"
import styles from "./page.module.css"

import { collections as staticCollections, products as staticProducts } from "@/lib/products"

interface CollectionItem {
  slug: string
  name: string
  description: string
  image: string
  _count: { products: number }
}

async function CollectionsGrid() {
  let collectionsData: CollectionItem[] = []
  try {
    collectionsData = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: true } } },
    })
  } catch {
    // Database connection refused or offline, fallback to static collections
  }

  const list = collectionsData.length > 0 ? collectionsData : staticCollections.map((col) => {
    const count = staticProducts.filter((p) => p.category === col.slug).length
    return {
      slug: col.slug,
      name: col.name,
      description: col.description,
      image: col.image,
      _count: { products: count },
    }
  })

  return (
    <div className={styles.grid}>
      {list.map((collection) => (
        <Link
          key={collection.slug}
          href={`/collections/${collection.slug}`}
          className={styles.card}
        >
          <div className={styles.cardImageWrapper}>
            <Image
              src={collection.image}
              alt={collection.name}
              fill
              className={styles.cardImage}
            />
          </div>
          <div className={styles.cardOverlay} />
          <div className={styles.cardContent}>
            <span className={styles.cardCount}>
              {collection._count.products}{" "}
              {collection._count.products === 1 ? "Piece" : "Pieces"}
            </span>
            <h2 className={styles.cardTitle}>{collection.name}</h2>
            <span className={styles.cardAction}>View Collection</span>
          </div>
        </Link>
      ))}
    </div>
  )
}

function CollectionsGridFallback() {
  return (
    <div className={styles.grid}>
      {[...Array(6)].map((_, i) => (
        <div key={i} className={styles.card}>
          <div className={styles.cardImageWrapper} />
          <div className={styles.cardOverlay} />
          <div className={styles.cardContent}>
            <div style={{ height: 14, width: 60, background: "rgba(255,255,255,0.1)", marginBottom: 8 }} />
            <div style={{ height: 24, width: "70%", background: "rgba(255,255,255,0.08)", marginBottom: 6 }} />
            <div style={{ height: 14, width: "90%", background: "rgba(255,255,255,0.05)", marginBottom: 12 }} />
            <div style={{ height: 12, width: 100, background: "rgba(255,255,255,0.06)" }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function CollectionsPage() {
  return (
    <div className={styles.page}>
      <Header />
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <span className={styles.heroSubtitle}>Our Collections</span>
          <h1 className={styles.heroTitle}>Explore by Category</h1>
          <p className={styles.heroDesc}>
            From everyday elegance to haute joaillerie masterpieces, discover jewelry
            that speaks to every moment and milestone.
          </p>
        </div>
      </section>

      <section className={styles.gridSection}>
        <Suspense fallback={<CollectionsGridFallback />}>
          <CollectionsGrid />
        </Suspense>
      </section>
    </div>
  )
}
