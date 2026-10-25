import { readLocalProductImage } from "@/lib/local-product-images"
export async function GET(_request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params
  const image = await readLocalProductImage(filename)
  if (!image) return new Response("Image not found", { status: 404 })
  return new Response(new Uint8Array(image.buffer), { headers: { "Content-Type": image.contentType, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" } })
}
