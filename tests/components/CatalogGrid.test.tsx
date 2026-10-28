import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
const mocks = vi.hoisted(() => ({ products: vi.fn(), count: vi.fn(), categories: vi.fn() }))
vi.mock("@/lib/db", () => ({ prisma: { product: { findMany: mocks.products, count: mocks.count }, category: { findMany: mocks.categories } } }))
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`Redirect: ${url}`) } }))
import CatalogGrid from "@/components/CatalogGrid"

beforeEach(() => {
  vi.resetAllMocks()
  mocks.products.mockResolvedValue([
    { id: "ring", slug: "silver-ring", name: "Silver Ring", subcategory: null, images: [] },
    { id: "necklace", slug: "cross&hands", name: "Cross Necklace", subcategory: null, images: [] },
  ])
  mocks.count.mockResolvedValue(2)
  mocks.categories.mockResolvedValue([{ slug: "rings", name: "Rings", _count: { products: 1 } }, { slug: "necklaces", name: "Necklaces", _count: { products: 1 } }])
})
describe("Full catalog", () => {
  it("opens across all categories with a bounded page size", async () => {
    render(await CatalogGrid())
    expect(mocks.products).toHaveBeenCalledWith(expect.objectContaining({ where: {}, take: 8, skip: 0 }))
    expect(screen.getByRole("link", { name: "View Silver Ring" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "View Cross Necklace" })).toHaveAttribute("href", "/products/cross%26hands")
    expect(screen.getByText("Showing 1–2 of 2 pieces")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "All Jewelry" })).toHaveAttribute("aria-current", "page")
    expect(screen.getByText("Page 1 of 1")).toBeInTheDocument()
  })
  it("keeps the selected category on page links and resets page when changing category", async () => {
    mocks.count.mockResolvedValue(25)
    render(await CatalogGrid({ searchParams: Promise.resolve({ category: "rings", page: "2" }) }))
    expect(mocks.products).toHaveBeenCalledWith(expect.objectContaining({ where: { category: { slug: "rings" } }, skip: 8, take: 8 }))
    expect(screen.getByRole("link", { name: "Next →" })).toHaveAttribute("href", "/catalog?category=rings&page=3")
    expect(screen.getByRole("link", { name: /Necklaces/ })).toHaveAttribute("href", "/catalog?category=necklaces")
    expect(screen.getByRole("link", { name: "All Jewelry" })).toHaveAttribute("href", "/catalog")
    expect(screen.getByRole("link", { name: "Page 2" })).toHaveAttribute("aria-current", "page")
  })
})

it("preserves metal, sorting, and search through category links and pagination", async () => {
  mocks.count.mockResolvedValue(25)
  mocks.products.mockResolvedValue([{ id: "ring", slug: "ring", name: "Ring", subcategory: null, images: [{ url: "/gold.jpg", metal: "Gold", sortOrder: 0 }, { url: "/silver.jpg", metal: "Silver", sortOrder: 1 }] }])
  render(await CatalogGrid({ searchParams: Promise.resolve({ category: "rings", q: "signet", metal: "Silver", sort: "name", page: "2" }) }))
  expect(mocks.products).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ metalOptions: { has: "Silver" } }), orderBy: [{ name: "asc" }, { id: "asc" }], skip: 8 }))
  expect(mocks.count).toHaveBeenCalledWith({ where: expect.objectContaining({ metalOptions: { has: "Silver" } }) })
  expect(screen.getByRole("link", { name: "Next →" })).toHaveAttribute("href", "/catalog?q=signet&category=rings&metal=Silver&sort=name&page=3")
  expect(screen.getByRole("link", { name: /Necklaces/ })).toHaveAttribute("href", "/catalog?q=signet&category=necklaces&metal=Silver&sort=name")
  expect(screen.getByRole("link", { name: "View Ring" })).toHaveAttribute("href", "/products/ring?metal=Silver")
  expect(screen.getByRole("combobox", { name: "Metal" })).toHaveValue("Silver")
  expect(screen.getByRole("combobox", { name: "Sort by" })).toHaveValue("name")
  expect(screen.getByRole("link", { name: "Remove Silver ×" })).toHaveAttribute("href", "/catalog?q=signet&category=rings&sort=name")
  expect(screen.getByRole("link", { name: "Clear all filters ×" })).toHaveAttribute("href", "/catalog")
  const form = screen.getByRole("combobox", { name: "Metal" }).closest("form")!
  expect(new FormData(form).has("page")).toBe(false)
  expect(screen.getByRole("img", { name: "Ring" })).toHaveAttribute("src", expect.stringContaining("url=%2Fsilver.jpg"))
})

it("keeps active choices when an out-of-range page redirects to the last page", async () => {
  mocks.count.mockResolvedValue(9)
  await expect(CatalogGrid({ searchParams: Promise.resolve({ metal: "Gold", sort: "name", page: "99" }) })).rejects.toThrow("Redirect: /catalog?metal=Gold&sort=name&page=2")
  expect(mocks.products).not.toHaveBeenCalled()
})
