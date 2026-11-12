import type { MetadataRoute } from "next"
import { publishedContent } from "./content-store"
import { publicServices, servicePath } from "./service-pages"

export async function getSitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://emanajewelries.com"

  let products: { slug: string; updatedAt?: Date }[] = []
  let collections: { slug: string }[] = []

  try {
    const { prisma } = await import("@/lib/db")
    const [dbProducts, dbCollections] = await Promise.all([
      prisma.product.findMany({ select: { slug: true, updatedAt: true } }),
      prisma.category.findMany({ select: { slug: true } }),
    ])
    products = dbProducts
    collections = dbCollections
  } catch {
    throw new Error("The sitemap is temporarily unavailable")
  }

  const staticPages = [
    { url: `${siteUrl}/services`, changeFrequency: "weekly" as const, priority: 0.8 },
    { url: siteUrl, changeFrequency: "weekly" as const, priority: 1 },
    { url: `${siteUrl}/catalog`, changeFrequency: "weekly" as const, priority: 0.9 },
    { url: `${siteUrl}/collections`, changeFrequency: "weekly" as const, priority: 0.9 },
    { url: `${siteUrl}/privacy`, changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${siteUrl}/terms`, changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${siteUrl}/ethical-sourcing`, changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${siteUrl}/faq`, changeFrequency: "monthly" as const, priority: 0.4 },
  ]

  const collectionPages = collections.map((c) => ({
    url: `${siteUrl}/collections/${encodeURIComponent(c.slug)}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }))

  const productPages = products.map((p) => ({
    url: `${siteUrl}/products/${encodeURIComponent(p.slug)}`,
    ...(p.updatedAt ? { lastModified: p.updatedAt } : {}),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }))

  const { services } = await publishedContent()
  const servicePages = publicServices(services).map(service => ({ url: `${siteUrl}${servicePath(service.id)}` }))
  return [...staticPages, ...collectionPages, ...productPages, ...servicePages]
}
