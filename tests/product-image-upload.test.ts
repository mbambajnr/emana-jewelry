// @vitest-environment node
import { expect, it, vi } from "vitest"
import sharp from "sharp"
vi.mock("@/lib/request-safety", () => ({ RequestError: class extends Error { constructor(message: string, public status = 400) { super(message) } } }))
import { uploadedPhoto } from "@/lib/product-image-upload"
const request = (bytes: Buffer, type = "image/png") => { const form = new FormData(); form.set("file", new File([new Uint8Array(bytes)], "photo", { type })); return new Request("http://localhost/upload", { method: "POST", body: form }) }
it("decodes and resizes uploaded images to bounded WebP output", async () => {
  const bytes = await sharp({ create: { width: 3000, height: 1000, channels: 3, background: "gold" } }).png().toBuffer()
  const image = await uploadedPhoto(request(bytes)), metadata = await sharp(image).metadata()
  expect(metadata.format).toBe("webp"); expect(metadata.width).toBe(2048); expect(metadata.height).toBeLessThan(2048)
})
it("rejects truncated images, excessive decoded dimensions and oversized bodies", async () => {
  await expect(uploadedPhoto(request(Buffer.from([137,80,78,71,13,10,26,10])))).rejects.toThrow(/read this photo/)
  const bomb = await sharp({ create: { width: 5100, height: 5000, channels: 3, background: "white" } }).png().toBuffer()
  await expect(uploadedPhoto(request(bomb))).rejects.toThrow(/25 megapixels/)
  await expect(uploadedPhoto(new Request("http://localhost/upload", { method: "POST", headers: { "content-length": String(12 * 1024 * 1024) }, body: "small" }))).rejects.toMatchObject({ status: 413 })
})
