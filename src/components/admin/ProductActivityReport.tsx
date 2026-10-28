import Link from "next/link"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/db"
import styles from "@/app/admin/analytics/analytics.module.css"

async function activitySince() { return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }

export default async function ProductActivityReport() {
  await requireAdmin()
  const where = { createdAt: { gte: await activitySince() } }
  let data
  try {
    const [views, clicks, viewed, enquired, metals] = await Promise.all([
      prisma.productView.count({ where }),
      prisma.whatsAppClick.count({ where: { ...where, productSlug: { not: null } } }),
      prisma.productView.groupBy({ by: ["productSlug"], where, _count: { id: true }, orderBy: { _count: { id: "desc" } }, take: 20 }),
      prisma.whatsAppClick.groupBy({ by: ["productSlug"], where: { ...where, productSlug: { not: null } }, _count: { id: true }, orderBy: { _count: { id: "desc" } }, take: 20 }),
      prisma.whatsAppClick.groupBy({ by: ["metal"], where: { ...where, productSlug: { not: null }, metal: { not: null } }, _count: { id: true } }),
    ])
    const slugs = [...new Set([...viewed.map(row => row.productSlug), ...enquired.flatMap(row => row.productSlug ? [row.productSlug] : [])])]
    const products = slugs.length ? await prisma.product.findMany({ where: { slug: { in: slugs } }, select: { slug: true, name: true } }) : []
    data = { views, clicks, viewed, enquired, metals, products, slugs }
  } catch { return <p role="alert">Product activity could not be loaded. Check the database and migrations, then refresh.</p> }
  const { views, clicks, viewed, enquired, metals, products, slugs } = data
    const names = new Map(products.map(product => [product.slug, product.name]))
    const viewCounts = new Map(viewed.map(row => [row.productSlug, row._count.id]))
    const clickCounts = new Map(enquired.map(row => [row.productSlug, row._count.id]))
    return <section className={styles.section} aria-labelledby="product-activity-title">
      <h2 id="product-activity-title" className={styles.sectionTitle}>Product interest · last 30 days</h2>
      <p className={styles.explanation}>Views are counted at most once per product every 30 minutes in a browser tab. WhatsApp clicks open a chat; they do not confirm a sent message or a sale. Tracking starts from this update and respects browser privacy signals.</p>
      <div className={styles.stats}>
        <div className={styles.statCard}><span className={styles.statValue}>{views}</span><span className={styles.statLabel}>Product views</span></div>
        <div className={styles.statCard}><span className={styles.statValue}>{clicks}</span><span className={styles.statLabel}>Product WhatsApp clicks</span></div>
        {metals.map(row => <div className={styles.statCard} key={row.metal}><span className={styles.statValue}>{row._count.id}</span><span className={styles.statLabel}>{row.metal} enquiries</span></div>)}
      </div>
      {slugs.length ? <div className={styles.tableScroll}><table className={styles.table}><caption>Products among the top 20 by views or WhatsApp clicks. A dash means no row in that list; the count may be zero or outside the top 20.</caption><thead><tr><th>Product</th><th>Views</th><th>WhatsApp clicks</th></tr></thead><tbody>{slugs.map(slug => <tr key={slug}><td>{names.has(slug) ? <Link href={`/products/${encodeURIComponent(slug)}`}>{names.get(slug)}</Link> : slug}</td><td>{viewCounts.get(slug) ?? "—"}</td><td>{clickCounts.get(slug) ?? "—"}</td></tr>)}</tbody></table></div> : <p>No product activity recorded yet.</p>}
    </section>
}
