import { boundedJson, RequestError } from "@/lib/request-safety"
import { productInput } from "@/lib/product-input"
import { validateProductInformation } from "@/lib/product-information"
import { photoMetal, validateMetalOptions } from "@/lib/product-options"
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
    const body = productInput(await boundedJson(request, 262144))
    if (body.version === undefined) throw new RequestError("Reload this product before saving; a version reference is required.", 409)
    const youtubeUrl = body.youtubeUrl === undefined ? undefined : normalizeYoutubeUrl(body.youtubeUrl)

    const product = await prisma.product.update({
      where: { id, version: body.version },
      data: {
        version: { increment: 1 },
        youtubeUrl,
        metalOptions: body.metalOptions === undefined ? undefined : validateMetalOptions(body.metalOptions),
        slug: body.slug,
        name: body.name,
        subcategory: body.subcategory === undefined ? undefined : body.subcategory || null,
        description: body.description,
        sku: body.sku,
        available: body.available ?? undefined,
        ...validateProductInformation(body),
        categoryId: body.categoryId,
        images: body.images === undefined ? undefined : {
          deleteMany: {},
          create: (body.images ?? []).map(
            (img: { url: string; alt?: string; metal?: unknown }, i: number) => ({
              url: img.url,
              metal: photoMetal(img.metal),
              alt: typeof img.alt === "string" ? img.alt.slice(0, 500) : "",
              sortOrder: i,
            }),
          ),
        },
        details: body.details === undefined ? undefined : {
          deleteMany: {},
          create: (body.details ?? []).map(
            (d: { text: string }, i: number) => ({
              text: d.text,
              sortOrder: i,
            }),
          ),
        },
        materials: body.materials === undefined ? undefined : {
          deleteMany: {},
          create: (body.materials ?? []).map(
            (m: { metal: string; purity: string; weight?: string }) => ({
              metal: m.metal,
              purity: m.purity,
              weight: m.weight || null,
            }),
          ),
        },
        stones: body.stones === undefined ? undefined : {
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
    if ((err as { code?: string }).code === "P2025") return NextResponse.json({ error: "This product changed in another tab. Reload it before saving. Your edits have not been applied." }, { status: 409 })
    if (err instanceof RequestError) return NextResponse.json({ error: err.message }, { status: err.status })
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
