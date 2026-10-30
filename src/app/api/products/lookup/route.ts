import { canonicalReference } from "@/lib/request-safety"
import { prisma } from "@/lib/db"
export async function GET(request: Request) {
  let slugs: string[]
  try {
    const raw = new URL(request.url).searchParams.get("slugs") || "[]"
    if (raw.length > 4000) throw new Error()
    const value = JSON.parse(raw)
    if (!Array.isArray(value) || value.length > 12 || value.some(item => typeof item !== "string" || !item || item.length > 160)) throw new Error()
    slugs = [...new Set(value)]
  } catch { return Response.json({ error: "Invalid product references" }, { status: 400 }) }
  if (!slugs.length) return Response.json([])
  try {
    const products = await prisma.product.findMany({ where: { slug: { in: slugs } }, select: { id: true, slug: true, name: true, images: { orderBy: { sortOrder: "asc" }, take: 2, select: { url: true, alt: true } } } })
    const bySlug = new Map(products.map(product => [canonicalReference(product.slug), product]))
    return Response.json(slugs.flatMap(slug => bySlug.has(canonicalReference(slug)) ? [bySlug.get(canonicalReference(slug))!] : []), { headers: { "Cache-Control": "no-store" } })
  } catch { return Response.json({ error: "Products temporarily unavailable" }, { status: 503 }) }
}
