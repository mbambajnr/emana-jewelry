import "server-only"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

const directory = path.join(process.cwd(), ".data", "product-images")
const types: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif" }
export async function storeLocalProductImage(buffer: Buffer, extension: string) {
  if (process.env.NODE_ENV === "production") throw new Error("Local image storage is for development only")
  if (!types[extension]) throw new Error("Unsupported image")
  const filename = `${crypto.randomUUID()}.${extension}`
  await mkdir(directory, { recursive: true })
  await writeFile(path.join(directory, filename), buffer, { flag: "wx", mode: 0o600 })
  return `/media/products/${filename}`
}
export async function readLocalProductImage(filename: string) {
  if (process.env.NODE_ENV === "production" || !/^[0-9a-f-]{36}\.(jpg|png|webp|avif)$/.test(filename)) return null
  try { return { buffer: await readFile(path.join(directory, filename)), contentType: types[filename.split(".").pop()!] } }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error }
}
