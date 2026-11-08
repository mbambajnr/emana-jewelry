import { isAdminRequest } from "@/lib/admin-request"
import { uploadedPhoto } from "@/lib/product-image-upload"
import { consumeLimit, RequestError } from "@/lib/request-safety"
import { NextResponse } from "next/server"
import { storeLocalProductImage } from "@/lib/local-product-images"

export async function POST(request: Request) {
  if (!await isAdminRequest(request)) return NextResponse.json({ error: "Admin sign-in required" }, { status: 401 })
  try {
    await consumeLimit("admin-image-upload", "site", 60)
    const buffer = await uploadedPhoto(request)
    const ext = "webp", fileName = `${crypto.randomUUID()}.webp`

    if (process.env.IMAGE_STORAGE !== "supabase") {
      const url = await storeLocalProductImage(buffer, ext)
      return NextResponse.json({ url })
    }

    const { supabaseAdmin } = await import("@/lib/supabase")
    const { error } = await supabaseAdmin.storage
      .from("product-images")
      .upload(fileName, buffer, {
        contentType: "image/webp",
        upsert: false,
      })

    if (error) {
      return NextResponse.json({ error: "The photo could not be stored. Please check the cloud storage connection and product-images bucket." }, { status: 503 })
    }

    const { data: publicUrl } = supabaseAdmin.storage
      .from("product-images")
      .getPublicUrl(fileName)

    return NextResponse.json({ url: publicUrl.publicUrl })
  } catch (error) {
    if (error instanceof RequestError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: "We couldn’t upload this photo. Please check the image storage connection and try again." }, { status: 503 })
  }
}
