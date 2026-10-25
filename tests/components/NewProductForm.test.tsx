import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
const mocks = vi.hoisted(() => ({ auth: vi.fn(), categories: vi.fn() }))
vi.mock("@/lib/auth", () => ({ requireAdmin: mocks.auth }))
vi.mock("@/lib/db", () => ({ prisma: { category: { findMany: mocks.categories } } }))
vi.mock("@/app/admin/products/product-form", () => ({ default: ({ categories }: { categories: { name: string }[] }) => <div>Product form: {categories[0]?.name || "no collections yet"}</div> }))
import NewProductForm from "@/components/admin/NewProductForm"
beforeEach(() => vi.resetAllMocks())
describe("New product database states", () => {
  it("renders a useful outage message without sending the Error to the logger", async () => {
    mocks.categories.mockRejectedValue(new Error("Database offline"))
    const warning = vi.spyOn(console, "warn")
    render(await NewProductForm())
    expect(screen.getByRole("alert")).toHaveTextContent("We couldn’t load your collections")
    expect(screen.queryByText(/Product form:/)).not.toBeInTheDocument()
    expect(warning).not.toHaveBeenCalled()
    warning.mockRestore()
  })
  it("opens the product form even without any collections", async () => {
    mocks.categories.mockResolvedValue([])
    render(await NewProductForm())
    expect(screen.getByText("Product form: no collections yet")).toBeInTheDocument()
  })
  it("renders the form with database collections after checking admin access", async () => {
    mocks.categories.mockResolvedValue([{ id: "real-id", slug: "rings", name: "Rings" }])
    render(await NewProductForm())
    expect(mocks.auth).toHaveBeenCalledOnce()
    expect(screen.getByText("Product form: Rings")).toBeInTheDocument()
  })
})
