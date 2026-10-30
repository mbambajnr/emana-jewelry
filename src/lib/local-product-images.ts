import "server-only"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

const types: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif" }
function directory() {
  const configured = process.env.PRODUCT_IMAGE_DIRECTORY
  if (configured) {
    if (!path.isAbsolute(configured)) throw new Error("PRODUCT_IMAGE_DIRECTORY must be an absolute persistent path")
    if (process.env.NODE_ENV === "production" && (path.resolve(configured) === process.cwd() || path.resolve(configured).startsWith(process.cwd() + path.sep))) throw new Error("Production images must live outside the application directory")
    return configured
  }
  if (process.env.NODE_ENV === "production") throw new Error("Configure persistent image storage before uploading")
  return path.join(process.cwd(), ".data", "product-images")
}
export function validImageBytes(buffer: Buffer, extension: string) {
  if (extension === "jpg") return buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255]))
  if (extension === "png") return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  if (extension === "webp") return buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP"
  if (extension === "avif") return buffer.toString("ascii", 4, 8) === "ftyp" && /avif|avis/.test(buffer.toString("ascii", 8, 64))
  return false
}
export async function storeLocalProductImage(buffer: Buffer, extension: string) {
  if (!types[extension] || !validImageBytes(buffer, extension)) throw new Error("The file contents do not match a supported image")
  const folder = directory(), filename = `${crypto.randomUUID()}.${extension}`
  await mkdir(folder, { recursive: true, mode: 0o700 })
  await writeFile(path.join(folder, filename), buffer, { flag: "wx", mode: 0o600 })
  return `/media/products/${filename}`
}
export async function readLocalProductImage(filename: string) {
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp|avif)$/.test(filename)) return null
  let folder: string
  try { folder = directory() } catch { return null }
  try { return { buffer: await readFile(path.join(folder, filename)), contentType: types[filename.split(".").pop()!] } }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error }
}
