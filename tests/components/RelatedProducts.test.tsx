import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
const mocks = vi.hoisted(() => ({ products: vi.fn() }))
vi.mock("@/lib/db", () => ({ prisma: { product: { findMany: mocks.products } } }))
import RelatedProducts from "@/components/RelatedProducts"
beforeEach(() => vi.resetAllMocks())
describe("Related pieces", () => {
  it("suggests other pieces from the collection without repeating the current one", async () => {
    mocks.products.mockResolvedValue([{ id: "2", slug: "other-ring", name: "Another Ring", images: [] }])
    render(await RelatedProducts({ slug: "current-ring", category: "rings" }))
    expect(mocks.products).toHaveBeenCalledWith(expect.objectContaining({ where: { slug: { not: "current-ring" }, category: { slug: "rings" } }, take: 4 }))
    expect(screen.getByRole("link", { name: "View Another Ring" })).toBeInTheDocument()
  })
})

it("prioritises matching subcategories and fills the remaining spaces without duplicates", async () => {
  mocks.products.mockResolvedValueOnce([{ id: "2", slug: "matching-pendant", name: "Matching Pendant", images: [] }]).mockResolvedValueOnce([{ id: "3", slug: "other-necklace", name: "Other Necklace", images: [] }])
  render(await RelatedProducts({ slug: "current", category: "necklaces", subcategory: "Pendant" }))
  expect(mocks.products).toHaveBeenNthCalledWith(1, expect.objectContaining({ where: { slug: { not: "current" }, category: { slug: "necklaces" }, subcategory: { equals: "Pendant" } }, take: 4 }))
  expect(mocks.products).toHaveBeenNthCalledWith(2, expect.objectContaining({ where: { slug: { not: "current" }, category: { slug: "necklaces" }, id: { notIn: ["2"] } }, take: 3 }))
  expect(screen.getAllByRole("heading", { level: 3 }).map(heading => heading.textContent)).toEqual(["Matching Pendant", "Other Necklace"])
  expect(screen.getByRole("link", { name: "View all jewelry →" })).toHaveAttribute("href", "/catalog")
})

it("keeps matching suggestions when the fallback query fails", async () => {
  mocks.products.mockResolvedValueOnce([{ id: "2", slug: "match", name: "Matching Ring", images: [] }]).mockRejectedValueOnce(new Error("Offline"))
  render(await RelatedProducts({ slug: "current", category: "rings", subcategory: "Signet" }))
  expect(screen.getByRole("link", { name: "View Matching Ring" })).toBeInTheDocument()
})

it("hides the section for empty collections and database outages", async () => {
  mocks.products.mockResolvedValueOnce([])
  const { container, unmount } = render(await RelatedProducts({ slug: "only-ring", category: "rings" }))
  expect(container).toBeEmptyDOMElement()
  unmount()
  mocks.products.mockRejectedValueOnce(new Error("Offline"))
  const failed = render(await RelatedProducts({ slug: "only-ring", category: "rings" }))
  expect(failed.container).toBeEmptyDOMElement()
})

it("stops after four matching pieces", async () => {
  mocks.products.mockResolvedValueOnce(Array.from({ length: 4 }, (_, i) => ({ id: String(i), slug: `ring-${i}`, name: `Ring ${i}`, images: [] })))
  render(await RelatedProducts({ slug: "current", category: "rings", subcategory: "Signet" }))
  expect(mocks.products).toHaveBeenCalledTimes(1)
  expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(4)
})
