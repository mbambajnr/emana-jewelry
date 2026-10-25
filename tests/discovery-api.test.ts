import { beforeEach, describe, it, expect, vi } from "vitest"
const mocks = vi.hoisted(() => ({ products: vi.fn() }))
vi.mock("@/lib/db", () => ({ prisma: { product: { findMany: mocks.products } } }))
import { GET } from "@/app/api/products/lookup/route"
const request = (slugs: unknown) => new Request(`http://localhost:3000/api/products/lookup?${new URLSearchParams({ slugs: JSON.stringify(slugs) })}`)
beforeEach(() => vi.resetAllMocks())
describe("Recently viewed public product lookup", () => {
  it("keeps viewing order and leaves deleted products out", async () => {
    mocks.products.mockResolvedValue([{ id: "b", slug: "b", name: "B", images: [] }, { id: "a", slug: "a", name: "A", images: [] }])
    const response = await GET(request(["a", "deleted", "b"]))
    expect((await response.json()).map((item: { slug: string }) => item.slug)).toEqual(["a", "b"])
    expect(mocks.products.mock.calls[0][0].select).not.toHaveProperty("price")
  })
  it("rejects oversized or malformed lists and returns an honest storage error", async () => {
    expect((await GET(request(Array(13).fill("ring")))).status).toBe(400)
    expect((await GET(request([123]))).status).toBe(400)
    mocks.products.mockRejectedValue(new Error("offline"))
    expect((await GET(request(["ring"]))).status).toBe(503)
  })
})
