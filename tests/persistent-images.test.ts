import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { mkdtemp, rm, stat } from "node:fs/promises"
import path from "node:path"
import os from "node:os"
import { readLocalProductImage, storeLocalProductImage } from "@/lib/local-product-images"
let folder: string
const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0])
beforeEach(async () => { folder = await mkdtemp(path.join(os.tmpdir(), "emana-images-test-")); vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("PRODUCT_IMAGE_DIRECTORY", folder) })
afterEach(async () => { vi.unstubAllEnvs(); await rm(folder, { recursive: true, force: true }) })
it("serves files from persistent storage in production without changing public URLs", async () => {
  const url = await storeLocalProductImage(png, "png")
  expect(url).toMatch(/^\/media\/products\/[a-f0-9-]+\.png$/)
  const image = await readLocalProductImage(url.split("/").pop()!)
  expect(image?.buffer).toEqual(png)
  expect(image?.contentType).toBe("image/png")
  expect((await stat(path.join(folder, url.split("/").pop()!))).mode & 0o777).toBe(0o600)
})
it("rejects traversal, wrong file signatures, and unsafe production locations", async () => {
  expect(await readLocalProductImage("../private.env")).toBeNull()
  await expect(storeLocalProductImage(Buffer.from("not a photo"), "png")).rejects.toThrow()
  vi.stubEnv("PRODUCT_IMAGE_DIRECTORY", process.cwd())
  await expect(storeLocalProductImage(png, "png")).rejects.toThrow(/outside/)
})
