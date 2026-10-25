import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import ProductSnippets from "@/components/ProductSnippets"

describe("Homepage product preview", () => {
  it("shows four pieces and links to the complete catalog", () => {
    const products = Array.from({ length: 6 }, (_, index) => ({ id: String(index), slug: `piece-${index}`, name: `Piece ${index}`, description: "Handmade jewelry", category: "rings", categoryName: "Rings", subcategory: null, price: 0, images: [], materials: [], stones: [] }))
    render(<ProductSnippets products={products} />)
    expect(screen.getAllByRole("link", { name: "Piece 3" }).length).toBeGreaterThan(0)
    expect(screen.queryByRole("link", { name: "Piece 4" })).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: "View More" })).toHaveAttribute("href", "/catalog")
  })
})
