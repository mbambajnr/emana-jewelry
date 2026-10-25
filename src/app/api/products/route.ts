import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { staticProducts } from "@/lib/products"

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        category: true,
      },
      orderBy: { createdAt: "desc" },
    })

    if (products && products.length > 0) {
      return NextResponse.json(products.map(product => ({ ...product, price: 0, originalPrice: null })))
    }
  } catch (error) {
    console.warn("Database unavailable in /api/products, serving static catalog fallback:", error)
  }

  const fallback = staticProducts.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: 0,
    originalPrice: null,
    materials: p.materials,
    stones: p.stones,
    available: p.available,
    sku: p.sku,
    rating: p.rating,
    reviewCount: p.reviewCount,
    categoryId: p.category,
    category: {
      id: p.category,
      name: p.category.charAt(0).toUpperCase() + p.category.slice(1),
      slug: p.category,
      description: "",
      image: p.images[0] || "/gold_signet_ring.jpg",
      sortOrder: 0,
    },
    images: (p.images || []).map((url, idx) => ({
      id: `${p.id}-${idx}`,
      url,
      alt: p.name,
      sortOrder: idx,
      productId: p.id,
    })),
  }))

  return NextResponse.json(fallback)
}
