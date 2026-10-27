import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import ProductDetailClient, { type ProductFromDb } from "@/app/products/[slug]/product-detail-client"
import { getCart } from "@/lib/cart"

vi.mock("@/components/Footer", () => ({ default: () => null }))
vi.mock("@/components/ProductGallery", () => ({ default: () => null }))
vi.mock("@/components/RecentlyViewed", () => ({ default: () => null }))
vi.mock("@/components/CatalogReturnLink", () => ({ default: () => null }))
const product: ProductFromDb = {
  id: "piece", slug: "pendant", name: "Pendant", subcategory: null, metalOptions: ["Gold", "Silver"],
  price: 0, originalPrice: null, description: "A pendant", available: true, sku: "P1", rating: 0, reviewCount: 0,
  category: { slug: "necklaces", name: "Necklaces" }, images: [], materials: [], stones: [], details: [], reviews: [],
}

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}"))
})

describe("product metal choices", () => {
  it("carries the selected metal into the quote list and WhatsApp message", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null)
    const user = userEvent.setup()
    render(<ProductDetailClient product={product} />)
    await user.click(screen.getByRole("radio", { name: "Silver" }))
    await user.click(screen.getByRole("button", { name: "Add to Quote Request" }))
    expect(getCart()).toEqual([expect.objectContaining({ slug: "pendant", metal: "Silver" })])
    await user.click(screen.getByRole("button", { name: "Ask Us on WhatsApp" }))
    expect(new URL(String(open.mock.calls[0][0])).searchParams.get("text")).toContain("*Pendant* in Silver")
  })
  it("only offers choices configured for the product", () => {
    render(<ProductDetailClient product={{ ...product, metalOptions: ["Silver"] }} />)
    expect(screen.queryByRole("radio", { name: "Gold" })).not.toBeInTheDocument()
    expect(screen.getByRole("radio", { name: "Silver" })).toBeChecked()
  })
})
