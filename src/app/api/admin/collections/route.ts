import { NextResponse } from "next/server"
import { isAdminRequest } from "@/lib/admin-request"
import { prisma } from "@/lib/db"
import { text } from "@/lib/request-validation"

export async function POST(request: Request) {
  if (!await isAdminRequest(request)) return NextResponse.json({ error: "Admin sign-in required" }, { status: 401 })
  let name: string
  try { name = text((await request.json()).name, "the collection name", 100) }
  catch { return NextResponse.json({ error: "Enter a collection name of up to 100 characters." }, { status: 400 }) }
  const slug = name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `collection-${crypto.randomUUID().slice(0, 8)}`
  try {
    const collection = await prisma.category.create({ data: { name, slug, description: `${name} from Emana Jewelry.`, image: "/hero_bg.png" }, select: { id: true, slug: true, name: true } })
    return NextResponse.json(collection, { status: 201 })
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") return NextResponse.json({ error: "A collection with this name already exists. Choose it from the list, or use a different name." }, { status: 409 })
    return NextResponse.json({ error: "We couldn’t save the collection. Your product details are still here—please try again." }, { status: 503 })
  }
}
