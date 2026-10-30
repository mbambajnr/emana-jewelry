import { boundedJson, RequestError } from "@/lib/request-safety"
import { productInput } from "@/lib/product-input"
import { validateProductInformation } from "@/lib/product-information"
import { photoMetal, validateMetalOptions } from "@/lib/product-options"
import { normalizeYoutubeUrl } from "@/lib/product-media"
import { isAdminRequest } from "@/lib/admin-request"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: Request) {
  if (!await isAdminRequest(request)) return NextResponse.json({ error: "Admin sign-in required" }, { status: 401 })
  try {
    const body = productInput(await boundedJson(request, 262144), true)
    const youtubeUrl = normalizeYoutubeUrl(body.youtubeUrl)

    const product = await prisma.product.create({
      data: {
        youtubeUrl,
        metalOptions: validateMetalOptions(body.metalOptions),
        slug: body.slug!,
        name: body.name!,
        subcategory: body.subcategory || null,
        price: 0,
        originalPrice: null,
        description: body.description!,
        sku: body.sku!,
        available: body.available ?? true,
        ...validateProductInformation(body),
        rating: 0,
        reviewCount: 0,
        categoryId: body.categoryId!,
        images: {
          create: (body.images ?? []).map(
            (img: { url: string; alt?: string; metal?: unknown }, i: number) => ({
              url: img.url,
              metal: photoMetal(img.metal),
              alt: typeof img.alt === "string" ? img.alt.slice(0, 500) : "",
              sortOrder: i,
            }),
          ),
        },
        details: {
          create: (body.details ?? []).map(
            (d: { text: string }, i: number) => ({
              text: d.text,
              sortOrder: i,
            }),
          ),
        },
        materials: {
          create: (body.materials ?? []).map(
            (m: { metal: string; purity: string; weight?: string }) => ({
              metal: m.metal,
              purity: m.purity,
              weight: m.weight || null,
            }),
          ),
        },
        stones: {
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

    return NextResponse.json(product, { status: 201 })
  } catch (err) {
    if (err instanceof RequestError) return NextResponse.json({ error: err.message }, { status: err.status })
    const message = err instanceof Error ? err.message : "Failed to create product"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
