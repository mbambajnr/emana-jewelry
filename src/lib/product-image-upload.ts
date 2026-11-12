import "server-only"
import { Jimp } from "jimp"
import { imageSize } from "image-size"
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
    const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png" }
    const ext = extensions[file.type]
    if (!ext || !file.size || file.size > 10 * 1024 * 1024) throw new RequestError("Upload a prepared JPG or PNG photo up to 10 MB.")
    const bytes = Buffer.from(await file.arrayBuffer())
    if (!validImageBytes(bytes, ext)) throw new RequestError("This file does not contain a supported image.")
    try {
      const dimensions = imageSize(bytes)
      if (!dimensions.width || !dimensions.height || dimensions.width * dimensions.height > 25000000) throw new Error("Image dimensions exceed limit")
      if (ext === "png") {
        let offset = 8
        while (offset + 12 <= bytes.length) {
          const size = bytes.readUInt32BE(offset)
          if (size > bytes.length - offset - 12) throw new Error("Invalid PNG chunk")
          if (bytes.toString("ascii", offset + 4, offset + 8) === "acTL") throw new Error("Animated images unsupported")
          offset += size + 12
        }
      }
      const image = await Jimp.read(bytes)
      const scale = Math.min(1, 2048 / image.bitmap.width, 2048 / image.bitmap.height)
      if (scale < 1) image.resize({ w: Math.max(1, Math.round(image.bitmap.width * scale)), h: Math.max(1, Math.round(image.bitmap.height * scale)) })
      const transparent = image.hasAlpha()
      const extension = transparent ? "png" : "jpg"
      const contentType = transparent ? "image/png" : "image/jpeg"
      const buffer = transparent ? await image.getBuffer("image/png") : await image.getBuffer("image/jpeg", { quality: 85 })
      if (buffer.length > 10 * 1024 * 1024) throw new Error("Image output too large")
      return { buffer, extension, contentType }
    } catch { throw new RequestError("We couldn’t read this photo. Use a still image under 25 megapixels and try again.") }
  } finally { processing = false }
}
