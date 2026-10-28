import { beforeEach, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
const mocks = vi.hoisted(() => ({ auth: vi.fn(), views: vi.fn(), clicks: vi.fn(), viewGroups: vi.fn(), clickGroups: vi.fn(), products: vi.fn() }))
vi.mock("@/lib/auth", () => ({ requireAdmin: mocks.auth }))
vi.mock("@/lib/db", () => ({ prisma: { productView: { count: mocks.views, groupBy: mocks.viewGroups }, whatsAppClick: { count: mocks.clicks, groupBy: mocks.clickGroups }, product: { findMany: mocks.products } } }))
import ProductActivityReport from "@/components/admin/ProductActivityReport"
beforeEach(() => { vi.resetAllMocks(); mocks.views.mockResolvedValue(5); mocks.clicks.mockResolvedValue(2); mocks.viewGroups.mockResolvedValue([{ productSlug: "ring", _count: { id: 5 } }]); mocks.clickGroups.mockResolvedValueOnce([{ productSlug: "ring", _count: { id: 2 } }]).mockResolvedValueOnce([{ metal: "Silver", _count: { id: 2 } }]); mocks.products.mockResolvedValue([{ slug: "ring", name: "Silver Ring" }]) })
it("reports recent product interest behind admin authentication without calling clicks sales", async () => {
  render(await ProductActivityReport())
  expect(mocks.auth).toHaveBeenCalledTimes(1)
  expect(mocks.views).toHaveBeenCalledWith({ where: { createdAt: { gte: expect.any(Date) } } })
  expect(screen.getByRole("link", { name: "Silver Ring" })).toHaveAttribute("href", "/products/ring")
  expect(screen.getByText("Silver enquiries")).toBeInTheDocument()
  expect(screen.getByText(/do not confirm a sent message or a sale/)).toBeInTheDocument()
})
it("shows a database error rather than misleading zero totals", async () => {
  mocks.views.mockRejectedValue(new Error("Offline"))
  render(await ProductActivityReport())
  expect(screen.getByRole("alert")).toHaveTextContent("Product activity could not be loaded")
  expect(screen.queryByText("Product views")).not.toBeInTheDocument()
})
it("does not query analytics before admin authentication succeeds", async () => {
  mocks.auth.mockRejectedValue(new Error("Login required"))
  await expect(ProductActivityReport()).rejects.toThrow("Login required")
  expect(mocks.views).not.toHaveBeenCalled()
})
