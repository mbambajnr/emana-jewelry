import { afterEach, expect, it, vi } from "vitest"
import { prepareUploadPhoto } from "@/lib/prepare-upload-photo"
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })
it.each([false, true])("converts browser-supported inputs and releases decoded resources, transparent=%s", async transparent => {
  const close = vi.fn()
  vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({ width: 4000, height: 2000, close }))
  const context = { drawImage: vi.fn(), getImageData: () => ({ data: new Uint8ClampedArray([1, 2, 3, transparent ? 0 : 255]) }) }
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as unknown as CanvasRenderingContext2D)
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function(this: HTMLCanvasElement, callback, type) {
    expect(this.width).toBe(2048); expect(this.height).toBe(1024)
    callback(new Blob(["fixture"], { type }))
  })
  const result = await prepareUploadPhoto(new File(["fixture"], "photo.avif", { type: "image/avif" }))
  expect(result.type).toBe(transparent ? "image/png" : "image/jpeg")
  expect(close).toHaveBeenCalledOnce()
})
it("rejects excessive decoded dimensions and frees the bitmap", async () => {
  const close = vi.fn()
  vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({ width: 10000, height: 10000, close }))
  await expect(prepareUploadPhoto(new File(["fixture"], "photo.webp", { type: "image/webp" }))).rejects.toThrow("25 megapixels")
  expect(close).toHaveBeenCalledOnce()
})
it("gives actionable feedback when the browser cannot decode a format", async () => {
  vi.stubGlobal("createImageBitmap", vi.fn().mockRejectedValue(new Error("Unsupported")))
  await expect(prepareUploadPhoto(new File(["fixture"], "photo.avif", { type: "image/avif" }))).rejects.toThrow("Try a JPG or PNG")
})
