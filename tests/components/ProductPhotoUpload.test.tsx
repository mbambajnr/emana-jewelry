import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }))
import ProductForm from "@/app/admin/products/product-form"
beforeEach(() => vi.restoreAllMocks())
describe("Product photo upload feedback", () => {
  it("shows the uploaded photo immediately", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ url: "/media/products/test.jpg" }), { status: 200 }))
    render(<ProductForm categories={[]} />)
    fireEvent.change(screen.getByLabelText("Upload product photos"), { target: { files: [new File(["image"], "ring.jpg", { type: "image/jpeg" })] } })
    await waitFor(() => expect(screen.getByRole("img", { name: "Product photo 1 preview" })).toHaveAttribute("src", "/media/products/test.jpg"))
  })
  it("shows the server error instead of silently dropping the upload", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ error: "Image storage is unavailable." }), { status: 503 }))
    render(<ProductForm categories={[]} />)
    fireEvent.change(screen.getByLabelText("Upload product photos"), { target: { files: [new File(["image"], "ring.jpg", { type: "image/jpeg" })] } })
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Image storage is unavailable."))
  })
  it("explains a broken preview rather than hiding it without a message", () => {
    render(<ProductForm categories={[]} product={{ images: [{ url: "/missing.jpg" }] }} />)
    fireEvent.error(screen.getByRole("img", { name: "Product photo 1 preview" }))
    expect(screen.getByRole("alert")).toHaveTextContent("This photo couldn’t be displayed")
  })
  it("keeps photo version labels attached when reordering and removing images", () => {
    render(<ProductForm categories={[]} product={{ images: [{ url: "/gold.jpg", metal: "Gold" }, { url: "/silver.jpg", metal: "Silver" }] }} />)
    fireEvent.click(screen.getByRole("button", { name: "Move photo 2 earlier" }))
    expect(screen.getByLabelText("Photo 1 URL")).toHaveValue("/silver.jpg")
    expect(screen.getByLabelText("Photo 1 metal")).toHaveValue("Silver")
    fireEvent.click(screen.getByRole("button", { name: "Remove photo 1" }))
    expect(screen.getByLabelText("Photo 1 URL")).toHaveValue("/gold.jpg")
    expect(screen.getByLabelText("Photo 1 metal")).toHaveValue("Gold")
  })

})

it("loads and saves product information through the editor", async () => {
  const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }))
  const { container } = render(<ProductForm categories={[{ id: "rings", name: "Rings", slug: "rings" }]} product={{ id: "piece", name: "Ring", slug: "ring", sku: "R1", description: "A ring", categoryId: "rings", availabilityStatus: "made_to_order", sizeNotes: "Sizes 6 to 9", deliveryNotes: "Collect in store", careInstructions: "Soft cloth only" }} />)
  expect(screen.getByLabelText("Availability")).toHaveValue("made_to_order")
  expect(screen.getByLabelText("Size information (optional)")).toHaveValue("Sizes 6 to 9")
  expect(screen.getByLabelText("Care instructions (optional)")).toHaveValue("Soft cloth only")
  fireEvent.change(screen.getByLabelText("Availability"), { target: { value: "confirm" } })
  fireEvent.change(screen.getByLabelText("Delivery notes (optional)"), { target: { value: "Ask us for delivery timing" } })
  fireEvent.submit(container.querySelector("form")!)
  await waitFor(() => expect(fetch).toHaveBeenCalled())
  expect(JSON.parse(String(fetch.mock.calls[0][1]?.body))).toMatchObject({ availabilityStatus: "confirm", sizeNotes: "Sizes 6 to 9", deliveryNotes: "Ask us for delivery timing", careInstructions: "Soft cloth only" })
})
