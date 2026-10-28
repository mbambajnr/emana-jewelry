import Link from "next/link"
import { prisma } from "@/lib/db"
import ProductRail, { type DiscoveryProduct } from "./ProductRail"

export default async function RelatedProducts({ slug, category, subcategory }: { slug: string; category: string; subcategory?: string | null }) {
  const select = { id: true, slug: true, name: true, images: { orderBy: { sortOrder: "asc" as const }, take: 2, select: { url: true, alt: true } } }
  const orderBy = [{ createdAt: "desc" as const }, { id: "desc" as const }]
  const where = { slug: { not: slug }, category: { slug: category } }
  let products: DiscoveryProduct[] = []
  try {
    if (subcategory?.trim()) {
      products = await prisma.product.findMany({ where: { ...where, subcategory: { equals: subcategory.trim() } }, take: 4, orderBy, select })
    }
    if (products.length < 4) {
      const more = await prisma.product.findMany({ where: { ...where, ...(products.length ? { id: { notIn: products.map(product => product.id) } } : {}) }, take: 4 - products.length, orderBy, select })
      products.push(...more)
    }
  } catch {
    // Keep a useful result if only the second query fails; suggestions never block the product.
  }
  return <ProductRail title="You may also like" subtitle="More pieces from this collection." products={products} action={<Link href="/catalog">View all jewelry →</Link>} />
}
