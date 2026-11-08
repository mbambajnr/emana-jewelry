import "server-only"
import sharp from "sharp"
import { RequestError } from "./request-safety"
import { validImageBytes } from "./local-product-images"

const MAX_BODY = 11 * 1024 * 1024
let processing = false
export async function uploadedPhoto(request: Request) {
  if (processing) throw new RequestError("Another photo is being processed. Please try again shortly.", 429)
  processing = true
  try {
    if (Number(request.headers.get("content-length")) > MAX_BODY) throw new RequestError("Choose an image up to 10 MB.", 413)
    const type = request.headers.get("content-type") || ""
    if (!type.startsWith("multipart/form-data;")) throw new RequestError("Choose a photo to upload.")
    const reader = request.body?.getReader()
    if (!reader) throw new RequestError("Choose a photo to upload.")
    const chunks: Uint8Array[] = []; let length = 0
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        length += value.length
        if (length > MAX_BODY) { await reader.cancel(); throw new RequestError("Choose an image up to 10 MB.", 413) }
        chunks.push(value)
      }
    } finally { reader.releaseLock() }
    let form: FormData
    try { form = await new Response(Buffer.concat(chunks), { headers: { "Content-Type": type } }).formData() }
    catch { throw new RequestError("We couldn’t read the upload. Choose the photo again.") }
    const file = form.get("file")
    if (!(file instanceof File)) throw new RequestError("Choose a photo to upload.")
    const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" }
    const ext = extensions[file.type]
    if (!ext || !file.size || file.size > 10 * 1024 * 1024) throw new RequestError("Choose a JPG, PNG, WebP, or AVIF image up to 10 MB.")
    const bytes = Buffer.from(await file.arrayBuffer())
    if (!validImageBytes(bytes, ext)) throw new RequestError("This file does not contain a supported image.")
    try {
      const image = sharp(bytes, { limitInputPixels: 25000000, failOn: "warning", sequentialRead: true })
      const metadata = await image.metadata()
      if ((metadata.pages || 1) > 1) throw new Error("Animated images unsupported")
      return await image.rotate().resize({ width: 2048, height: 2048, fit: "inside", withoutEnlargement: true }).webp({ quality: 82, effort: 3 }).toBuffer()
    } catch { throw new RequestError("We couldn’t read this photo. Use a still image under 25 megapixels and try again.") }
  } finally { processing = false }
}
