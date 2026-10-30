import { isAdminRequest } from "@/lib/admin-request"
import { NextResponse } from "next/server"
import { storeLocalProductImage, validImageBytes } from "@/lib/local-product-images"

export async function POST(request: Request) {
  if (!await isAdminRequest(request)) return NextResponse.json({ error: "Admin sign-in required" }, { status: 401 })
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const imageTypes: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" }
    if (!imageTypes[file.type] || file.size > 10 * 1024 * 1024 || file.size === 0) return NextResponse.json({ error: "Choose a JPG, PNG, WebP, or AVIF image up to 10 MB." }, { status: 400 })
    const ext = imageTypes[file.type]
    const fileName = `${crypto.randomUUID()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    if (!validImageBytes(buffer, ext)) return NextResponse.json({ error: "This file does not contain a supported image." }, { status: 400 })

    if (process.env.IMAGE_STORAGE !== "supabase") {
      const url = await storeLocalProductImage(buffer, ext)
      return NextResponse.json({ url })
    }

    const { supabaseAdmin } = await import("@/lib/supabase")
    const { error } = await supabaseAdmin.storage
      .from("product-images")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      return NextResponse.json({ error: "The photo could not be stored. Please check the cloud storage connection and product-images bucket." }, { status: 503 })
    }

    const { data: publicUrl } = supabaseAdmin.storage
      .from("product-images")
      .getPublicUrl(fileName)

    return NextResponse.json({ url: publicUrl.publicUrl })
  } catch {
    return NextResponse.json({ error: "We couldn’t upload this photo. Please check the image storage connection and try again." }, { status: 503 })
  }
}
