import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: { images: { orderBy: { sortOrder: "asc" } }, category: true },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(products.map(product => ({ ...product, price: 0, originalPrice: null })))
  } catch {
    return NextResponse.json({ error: "The catalog is temporarily unavailable. Please try again shortly." }, { status: 503, headers: { "Cache-Control": "no-store" } })
  }
}
