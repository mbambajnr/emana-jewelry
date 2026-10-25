import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }))
import ProductForm from "@/app/admin/products/product-form"

beforeEach(() => vi.restoreAllMocks())
describe("Inline collection creation", () => {
  it("does not ask the owner to enter a product price", () => {
    render(<ProductForm categories={[]} />)
    expect(screen.queryByText("Catalog estimate (GHS)")).not.toBeInTheDocument()
    expect(screen.getByText(/You don’t need to enter a price/)).toBeInTheDocument()
  })
  it("creates and selects a collection without losing product edits", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ id: "real-id", name: "Rings", slug: "rings" }), { status: 201 }))
    render(<ProductForm categories={[]} product={{ name: "My unfinished product" }} />)
    fireEvent.change(screen.getByLabelText("Collection name"), { target: { value: "Rings" } })
    fireEvent.click(screen.getByRole("button", { name: "Create and select" }))
    await waitFor(() => expect(screen.getByLabelText("Collection")).toHaveValue("real-id"))
    expect(screen.getByDisplayValue("My unfinished product")).toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent("Rings created and selected")
  })
  it("keeps entered details when collection creation fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ error: "Could not save. Please try again." }), { status: 503 }))
    render(<ProductForm categories={[]} product={{ name: "My unfinished product" }} />)
    fireEvent.change(screen.getByLabelText("Collection name"), { target: { value: "Rings" } })
    fireEvent.click(screen.getByRole("button", { name: "Create and select" }))
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Could not save"))
    expect(screen.getByDisplayValue("My unfinished product")).toBeInTheDocument()
    expect(screen.getByLabelText("Collection name")).toHaveValue("Rings")
  })
})
