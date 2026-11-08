import { isAdminRequest } from "@/lib/admin-request"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
    })

    return NextResponse.json(categories)
  } catch {
    return NextResponse.json({ error: "Collections are temporarily unavailable. Please try again shortly." }, { status: 503, headers: { "Cache-Control": "no-store" } })
  }
}

export async function POST(request: Request) {
  if (!await isAdminRequest(request)) return NextResponse.json({ error: "Admin sign-in required" }, { status: 401 })
  try {
    const body = await request.json()
    const { name, slug, description, image, sortOrder } = body

    if (!name || !slug || !description || !image) {
      return NextResponse.json({ error: "Missing required fields: name, slug, description, image" }, { status: 400 })
    }

    // Clean slug: lowercase, replace spaces with hyphens, remove non-alphanumeric except hyphen
    const cleanSlug = String(slug)
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")

    if (!cleanSlug) {
      return NextResponse.json({ error: "Invalid slug format" }, { status: 400 })
    }

    // Check if slug already exists
    const existing = await prisma.category.findUnique({
      where: { slug: cleanSlug },
    })

    if (existing) {
      return NextResponse.json({ error: "Category slug already exists" }, { status: 400 })
    }

    const category = await prisma.category.create({
      data: {
        name: String(name).trim(),
        slug: cleanSlug,
        description: String(description).trim(),
        image: String(image).trim(),
        sortOrder: Number(sortOrder) || 0,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create category"
    console.error("Category creation failed:", message, error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
