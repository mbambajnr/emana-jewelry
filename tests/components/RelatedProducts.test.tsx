import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
const mocks = vi.hoisted(() => ({ products: vi.fn() }))
vi.mock("@/lib/db", () => ({ prisma: { product: { findMany: mocks.products } } }))
import RelatedProducts from "@/components/RelatedProducts"
describe("Related pieces", () => {
  it("suggests other pieces from the collection without repeating the current one", async () => {
    mocks.products.mockResolvedValue([{ id: "2", slug: "other-ring", name: "Another Ring", images: [] }])
    render(await RelatedProducts({ slug: "current-ring", category: "rings" }))
    expect(mocks.products).toHaveBeenCalledWith(expect.objectContaining({ where: { slug: { not: "current-ring" }, category: { slug: "rings" } }, take: 4 }))
    expect(screen.getByRole("link", { name: "View Another Ring" })).toBeInTheDocument()
  })
})
