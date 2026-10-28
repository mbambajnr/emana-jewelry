import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
const mocks = vi.hoisted(() => ({ products: vi.fn() }))
vi.mock("@/lib/db", () => ({ prisma: { product: { findMany: mocks.products } } }))
vi.mock("next/server", () => ({ connection: async () => {} }))
import FeaturedProducts from "@/components/FeaturedProducts"
beforeEach(() => vi.resetAllMocks())
describe("Homepage live catalog", () => {
  it("displays saved products and uses actual collection names for filters", async () => {
    mocks.products.mockResolvedValue([
      { id: "1", name: "Iced Cross", slug: "cross&hands", description: "A pendant", price: 12345, subcategory: null, category: { slug: "necklace", name: "Our Necklaces" }, images: [{ url: "/gold_signet_ring.jpg" }, { url: "/royal_sapphire_ring.jpg" }], materials: [], stones: [] },
      { id: "2", name: "Silver Ring", slug: "silver-ring", description: "A ring", price: 800, subcategory: null, category: { slug: "rings", name: "Rings" }, images: [], materials: [], stones: [] },
    ])
    render(await FeaturedProducts())
    expect(screen.getAllByRole("link", { name: "Iced Cross" })[0]).toHaveAttribute("href", "/products/cross%26hands")
    expect(screen.getByRole("button", { name: "Our Necklaces" })).toBeInTheDocument()
    expect(screen.queryByText(/GHS/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Rings" }))
    expect(screen.getAllByRole("link", { name: "Silver Ring" }).length).toBeGreaterThan(0)
    expect(screen.queryByRole("link", { name: "Iced Cross" })).not.toBeInTheDocument()
  })
  it("shows an honest loading failure rather than claiming no products exist", async () => {
    mocks.products.mockRejectedValue(new Error("offline"))
    render(await FeaturedProducts())
    expect(screen.getByText(/We couldn’t load our pieces/)).toBeInTheDocument()
    expect(screen.queryByText("New Jewelry Coming Soon")).not.toBeInTheDocument()
  })
})
