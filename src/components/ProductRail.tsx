import type { ReactNode } from "react"
import Link from "next/link"
import ProductCardImage from "./ProductCardImage"
import styles from "./ProductRail.module.css"
export interface DiscoveryProduct { id: string; slug: string; name: string; images: { url: string; alt?: string | null }[] }
export default function ProductRail({ title, subtitle, products, action }: { title: string; subtitle?: string; products: DiscoveryProduct[]; action?: ReactNode }) {
  if (!products.length) return null
  return <section className={styles.section} aria-label={title}>
    <header className={styles.heading}><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</header>
    <div className={styles.grid}>{products.map(product => <article key={product.slug} data-product-card className={styles.card}>
      <Link href={`/products/${encodeURIComponent(product.slug)}`} className={styles.photo} aria-label={`View ${product.name}`}><ProductCardImage name={product.name} images={product.images} sizes="(max-width: 640px) 45vw, 25vw" /></Link>
      <h3><Link href={`/products/${encodeURIComponent(product.slug)}`}>{product.name}</Link></h3>
    </article>)}</div>
  </section>
}
