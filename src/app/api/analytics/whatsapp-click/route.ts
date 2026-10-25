import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { source, label, product } = await request.json()
    try {
      await prisma.whatsAppClick.create({
        data: {
          source: String(source || "unknown"),
          label: label ? String(label) : null,
          product: product ? String(product) : null,
        },
      })
    } catch (dbError) {
      console.warn("Analytics event could not be persisted to database (DB offline):", dbError)
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("WhatsApp click tracking request error:", error)
    return NextResponse.json({ success: false }, { status: 400 })
  }
}
