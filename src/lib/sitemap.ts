import type { MetadataRoute } from "next"
import { staticProducts, collections as staticCollections } from "@/lib/products"

export async function getSitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://emanajewelry.com"

  let products: { slug: string; updatedAt?: Date }[] = staticProducts.map((p) => ({
    slug: p.slug,
  }))
  let collections: { slug: string }[] = staticCollections.map((c) => ({
    slug: c.slug,
  }))

  try {
    const { prisma } = await import("@/lib/db")
    const [dbProducts, dbCollections] = await Promise.all([
      prisma.product.findMany({ select: { slug: true, updatedAt: true } }),
      prisma.category.findMany({ select: { slug: true } }),
    ])
    if (dbProducts && dbProducts.length > 0) {
      products = dbProducts
    }
    if (dbCollections && dbCollections.length > 0) {
      collections = dbCollections
    }
  } catch {
    console.warn("Database unavailable; using the static catalog for the sitemap.")
  }

  const staticPages = [
    { url: siteUrl, changeFrequency: "weekly" as const, priority: 1 },
    { url: `${siteUrl}/catalog`, changeFrequency: "weekly" as const, priority: 0.9 },
    { url: `${siteUrl}/collections`, changeFrequency: "weekly" as const, priority: 0.9 },
    { url: `${siteUrl}/privacy`, changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${siteUrl}/terms`, changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${siteUrl}/ethical-sourcing`, changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${siteUrl}/faq`, changeFrequency: "monthly" as const, priority: 0.4 },
  ]

  const collectionPages = collections.map((c) => ({
    url: `${siteUrl}/collections/${c.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }))

  const productPages = products.map((p) => ({
    url: `${siteUrl}/products/${encodeURIComponent(p.slug)}`,
    ...(p.updatedAt ? { lastModified: p.updatedAt } : {}),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }))

  return [...staticPages, ...collectionPages, ...productPages]
}
