import { prisma } from "@/lib/db"
import { isSameOrigin } from "@/lib/admin-request"

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ success: false }, { status: 403 })
  try {
    const raw = await request.text()
    if (raw.length > 2000) return Response.json({ success: false }, { status: 400 })
    let body
    try { body = JSON.parse(raw) } catch { return Response.json({ success: false }, { status: 400 }) }
    const { slug } = body || {}
    if (typeof slug !== "string" || !slug || slug.length > 160) return Response.json({ success: false }, { status: 400 })
    const product = await prisma.product.findUnique({ where: { slug }, select: { slug: true } })
    if (!product) return Response.json({ success: false }, { status: 404 })
    await prisma.productView.create({ data: { productSlug: product.slug } })
    return Response.json({ success: true })
  } catch { return Response.json({ success: false }, { status: 503 }) }
}
