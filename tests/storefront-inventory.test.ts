import { beforeEach, expect, it, vi } from "vitest"
const db = vi.hoisted(() => ({ products: vi.fn(), product: vi.fn(), categories: vi.fn(), category: vi.fn() }))
vi.mock("@/lib/db", () => ({ prisma: { product: { findMany: db.products, findUnique: db.product }, category: { findMany: db.categories, findUnique: db.category } } }))
vi.mock("@/lib/admin-request", () => ({ isAdminRequest: vi.fn() }))
vi.mock("@/lib/content-store", () => ({ publishedContent: async () => ({ services: [] }) }))
vi.mock("@/lib/products", async original => {
  const actual = await original<typeof import("@/lib/products")>()
  const fixture = { id: "demo", slug: "removed-demo-piece", name: "Demo piece", description: "Demo", category: "rings", price: 0, available: true, sku: "DEMO", rating: 0, reviewCount: 0, images: [], materials: [], stones: [], details: [], reviews: [] }
  return { ...actual, products: [fixture], staticProducts: [fixture] }
})
import { GET as products } from "@/app/api/products/route"
import { GET as categories } from "@/app/api/categories/route"
import { GET as sitemap } from "@/app/sitemap.xml/route"
import { generateMetadata } from "@/app/products/[slug]/page"
beforeEach(() => { vi.resetAllMocks(); db.products.mockResolvedValue([]); db.categories.mockResolvedValue([]); db.product.mockResolvedValue(null) })
it("keeps a successfully empty inventory empty instead of restoring sample stock", async () => {
  expect(await (await products()).json()).toEqual([])
  expect(await (await categories()).json()).toEqual([])
  const xml = await (await sitemap()).text()
  expect(xml).not.toContain("/products/"); expect(xml).not.toContain("/collections/rings")
})
it("returns unavailable responses during database failure without sample stock", async () => {
  db.products.mockRejectedValue(new Error("private-db-error")); db.categories.mockRejectedValue(new Error("private-db-error"))
  const responses = [await products(), await categories(), await sitemap()]
  for (const response of responses) { expect(response.status).toBe(503); expect(await response.text()).not.toContain("private-db-error") }
})
it("does not give a deleted sample product indexable product metadata", async () => {
  const metadata = await generateMetadata({ params: Promise.resolve({ slug: "removed-demo-piece" }) })
  expect(metadata).toMatchObject({ title: "Product Not Found", robots: { index: false } })
})
