import { normalizeYoutubeUrl } from "@/lib/product-media"
import { isAdminRequest } from "@/lib/admin-request"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!await isAdminRequest(request)) return NextResponse.json({ error: "Admin sign-in required" }, { status: 401 })
  try {
    const { id } = await params
    const body = await request.json()
    const youtubeUrl = normalizeYoutubeUrl(body.youtubeUrl)

    const product = await prisma.product.update({
      where: { id },
      data: {
        youtubeUrl,
        slug: body.slug,
        name: body.name,
        subcategory: body.subcategory || null,
        description: body.description,
        sku: body.sku,
        available: body.available ?? true,
        categoryId: body.categoryId,
        images: {
          deleteMany: {},
          create: (body.images ?? []).map(
            (img: { url: string; alt?: string }, i: number) => ({
              url: img.url,
              alt: typeof img.alt === "string" ? img.alt.slice(0, 500) : "",
              sortOrder: i,
            }),
          ),
        },
        details: {
          deleteMany: {},
          create: (body.details ?? []).map(
            (d: { text: string }, i: number) => ({
              text: d.text,
              sortOrder: i,
            }),
          ),
        },
        materials: {
          deleteMany: {},
          create: (body.materials ?? []).map(
            (m: { metal: string; purity: string; weight?: string }) => ({
              metal: m.metal,
              purity: m.purity,
              weight: m.weight || null,
            }),
          ),
        },
        stones: {
          deleteMany: {},
          create: (body.stones ?? []).map(
            (s: {
              type: string
              carat: string
              clarity?: string
              color?: string
              cut?: string
              certification?: string
            }) => ({
              type: s.type,
              carat: s.carat,
              clarity: s.clarity || null,
              color: s.color || null,
              cut: s.cut || null,
              certification: s.certification || null,
            }),
          ),
        },
      },
      include: {
        images: true,
        details: true,
        materials: true,
        stones: true,
        category: true,
      },
    })

    return NextResponse.json(product)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update product"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!await isAdminRequest(request)) return NextResponse.json({ error: "Admin sign-in required" }, { status: 401 })
  try {
    const { id } = await params
    await prisma.product.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete product"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
