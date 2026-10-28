import { prisma } from "@/lib/db"
import { isSameOrigin } from "@/lib/admin-request"
import { isMetalOption, productMetalOptions } from "@/lib/product-options"

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ success: false }, { status: 403 })
  try {
    const raw = await request.text()
    if (raw.length > 2000) return Response.json({ success: false }, { status: 400 })
    let body
    try { body = JSON.parse(raw) } catch { return Response.json({ success: false }, { status: 400 }) }
    if (!body || typeof body !== "object") return Response.json({ success: false }, { status: 400 })
    const { source, label, product, productSlug, metal } = body
    if (typeof source !== "string" || !source.startsWith("/") || source.startsWith("//") || source.length > 300 || source.includes("?") || source.includes("#") ||
      [label, product].some(value => value != null && (typeof value !== "string" || value.length > 300)) ||
      (productSlug != null && (typeof productSlug !== "string" || !productSlug || productSlug.length > 160)) || (metal != null && !isMetalOption(metal))) return Response.json({ success: false }, { status: 400 })
    let name = product || null
    if (productSlug) {
      const item = await prisma.product.findUnique({ where: { slug: productSlug }, select: { name: true, metalOptions: true } })
      if (!item || (metal && !productMetalOptions(item.metalOptions).includes(metal))) return Response.json({ success: false }, { status: 400 })
      name = item.name
    }
    await prisma.whatsAppClick.create({ data: { source, label: label || null, product: name, productSlug: productSlug || null, metal: metal || null } })
    return Response.json({ success: true })
  } catch { return Response.json({ success: false }, { status: 503 }) }
}
