import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SiteContentProvider } from "@/components/cms/SiteContentProvider"
import { defaultContent } from "@/lib/site-content"
import ProductDetailClient, { type ProductFromDb } from "@/app/products/[slug]/product-detail-client"
import { getCart } from "@/lib/cart"

vi.mock("@/components/Footer", () => ({ default: () => null }))
vi.mock("@/components/RecentlyViewed", () => ({ default: () => null }))
vi.mock("@/components/CatalogReturnLink", () => ({ default: () => null }))
const product: ProductFromDb = {
  id: "piece", slug: "pendant", name: "Pendant", subcategory: null, metalOptions: ["Gold", "Silver"],
  price: 0, originalPrice: null, description: "A pendant", available: true, sku: "P1", rating: 0, reviewCount: 0,
  category: { slug: "necklaces", name: "Necklaces" }, images: [{ url: "/gold.jpg", alt: "Gold pendant", metal: "Gold", sortOrder: 1 }, { url: "/silver.jpg", alt: "Silver pendant", metal: "Silver", sortOrder: 0 }], materials: [], stones: [], details: [], reviews: [],
}

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}"))
})

describe("product metal choices", () => {
  it("does not assume a metal from general photos and carries quantity into the price enquiry", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null)
    const user = userEvent.setup()
    render(<ProductDetailClient product={{ ...product, images: [{ url: "/general.jpg", sortOrder: 0 }] }} />)
    expect(screen.getByRole("radio", { name: "Gold" })).not.toBeChecked()
    expect(screen.getByRole("radio", { name: "Silver" })).not.toBeChecked()
    await user.click(screen.getByRole("button", { name: "Add to Quote List" }))
    expect(screen.getByRole("alert")).toHaveTextContent("Choose a metal")
    expect(getCart()).toEqual([])
    await user.click(screen.getByRole("radio", { name: "Silver" }))
    expect(screen.getByRole("status")).toHaveTextContent("confirm the Silver option")
    await user.selectOptions(screen.getByRole("combobox", { name: "Quantity" }), "2")
    await user.click(screen.getByRole("button", { name: "Get Price on WhatsApp" }))
    const message = new URL(String(open.mock.calls[0][0])).searchParams.get("text")
    expect(message).toContain("in Silver")
    expect(message).toContain("Quantity: 2")
  })
  it("carries the selected metal into the quote list and WhatsApp message", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null)
    const user = userEvent.setup()
    render(<ProductDetailClient product={product} />)
    expect(screen.getByRole("img", { name: "Gold pendant" })).toBeInTheDocument()
    await user.click(screen.getByRole("radio", { name: "Silver" }))
    expect(screen.getByRole("img", { name: "Silver pendant" })).toBeInTheDocument()
    expect(screen.queryByRole("img", { name: "Gold pendant" })).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Add to Quote List" }))
    expect(getCart()).toEqual([expect.objectContaining({ slug: "pendant", metal: "Silver", image: "/silver.jpg" })])
    await user.click(screen.getByRole("button", { name: "Get Price on WhatsApp" }))
    expect(new URL(String(open.mock.calls[0][0])).searchParams.get("text")).toContain("*Pendant* in Silver")
  })
  it("only offers choices configured for the product", () => {
    render(<ProductDetailClient product={{ ...product, metalOptions: ["Silver"] }} />)
    expect(screen.queryByRole("radio", { name: "Gold" })).not.toBeInTheDocument()
    expect(screen.getByRole("radio", { name: "Silver" })).toBeChecked()
  })
})

it("shows owner-supplied availability, sizes, delivery, and care without fixed pricing", () => {
  render(<ProductDetailClient product={{ ...product, availabilityStatus: "made_to_order", sizeNotes: "45 cm or 50 cm", deliveryNotes: "Collect after we confirm your order", careInstructions: "Wipe with a soft dry cloth" }} />)
  expect(screen.getByText("Made to order")).toBeInTheDocument()
  expect(screen.getAllByText("45 cm or 50 cm").length).toBeGreaterThan(0)
  expect(screen.getAllByText("Collect after we confirm your order")).toHaveLength(2)
  expect(screen.getByText("Wipe with a soft dry cloth")).toBeInTheDocument()
  expect(screen.getByRole("button", { name: "Get Price on WhatsApp" })).toBeInTheDocument()
})

it("keeps the quick enquiry in sync with the selected metal", async () => {
  const open = vi.spyOn(window, "open").mockReturnValue(null)
  const user = userEvent.setup()
  render(<ProductDetailClient product={product} />)
  await user.click(screen.getByRole("radio", { name: "Silver" }))
  expect(screen.getByRole("link", { name: "Change metal choice, currently Silver" })).toHaveAttribute("href", "#metal-choice")
  await user.click(screen.getByRole("button", { name: "Get Price" }))
  const message = new URL(String(open.mock.calls[0][0])).searchParams.get("text")
  expect(message).toContain("*Pendant* in Silver")
  expect(message).toContain("/products/pendant")
})

it("puts the enquiry controls before the longer description and disables enquiries in preview", () => {
  render(<ProductDetailClient product={product} preview />)
  const enquire = screen.getByRole("button", { name: "Get Price on WhatsApp" })
  const about = screen.getByRole("region", { name: "About this piece" })
  expect(enquire.compareDocumentPosition(about) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  expect(enquire).toBeDisabled()
  expect(screen.queryByRole("navigation", { name: "Quick product enquiry" })).not.toBeInTheDocument()
})

it("starts with the metal chosen in the catalogue, falling back to an offered option", () => {
  const { unmount } = render(<ProductDetailClient product={product} initialMetal="Silver" />)
  expect(screen.getByRole("radio", { name: "Silver" })).toBeChecked()
  expect(screen.getByRole("img", { name: "Silver pendant" })).toBeInTheDocument()
  unmount()
  render(<ProductDetailClient product={{ ...product, metalOptions: ["Gold"] }} initialMetal="Silver" />)
  expect(screen.getByRole("radio", { name: "Gold" })).toBeChecked()
})

it("uses published general guidance and links to full delivery, care, and returns details", () => {
  const document = { ...defaultContent, copy: { ...defaultContent.copy, "product.deliverySummary": "Ask about collection arrangements", "product.careDetails": "Speak to our team about aftercare", "product.returnsDetails": "Discuss changes with our team before ordering" } }
  render(<SiteContentProvider document={document}><ProductDetailClient product={product} /></SiteContentProvider>)
  expect(screen.getByText("Ask about collection arrangements")).toBeInTheDocument()
  expect(screen.getByText("Speak to our team about aftercare")).toBeInTheDocument()
  expect(screen.getByRole("link", { name: "Delivery, care & returns ↓" })).toHaveAttribute("href", "#delivery-and-care")
  expect(screen.getByText("Discuss changes with our team before ordering")).toBeInTheDocument()
})
