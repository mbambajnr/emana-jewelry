import { beforeEach, describe, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({ same: vi.fn(), find: vi.fn(), view: vi.fn(), click: vi.fn() }))
vi.mock("@/lib/admin-request", () => ({ isSameOrigin: mocks.same }))
vi.mock("@/lib/db", () => ({ prisma: { product: { findUnique: mocks.find }, productView: { create: mocks.view }, whatsAppClick: { create: mocks.click } } }))
vi.mock("@/lib/request-safety", async original => ({ ...await original<typeof import("@/lib/request-safety")>(), publicGuard: vi.fn() }))
import { POST as view } from "@/app/api/analytics/product-view/route"
import { POST as click } from "@/app/api/analytics/whatsapp-click/route"
const req = (body: unknown) => new Request("http://localhost:3000/api/analytics/product-view", { method: "POST", body: JSON.stringify(body) })
beforeEach(() => { vi.resetAllMocks(); mocks.same.mockReturnValue(true); mocks.find.mockResolvedValue({ slug: "ring", name: "Real Ring", metalOptions: ["Silver"] }) })
describe("Analytics endpoints", () => {
  it("validates a real product before counting a view", async () => {
    expect((await view(req({ slug: "ring" }))).status).toBe(200)
    expect(mocks.view).toHaveBeenCalledWith({ data: { productSlug: "ring" } })
    mocks.find.mockResolvedValue(null)
    expect((await view(req({ slug: "missing" }))).status).toBe(404)
    expect(mocks.view).toHaveBeenCalledTimes(1)
  })
  it("requires same-origin requests and rejects invalid or oversized payloads", async () => {
    mocks.same.mockReturnValue(false)
    expect((await view(req({ slug: "ring" }))).status).toBe(403)
    expect((await click(req({ source: "/catalog" }))).status).toBe(403)
    mocks.same.mockReturnValue(true)
    expect((await view(req({ slug: 42 }))).status).toBe(400)
    expect((await click(req({ source: "/catalog?q=private" }))).status).toBe(400)
    expect((await click(req({ source: "/catalog", label: "x".repeat(3000) }))).status).toBe(400)
    expect(mocks.view).not.toHaveBeenCalled(); expect(mocks.click).not.toHaveBeenCalled()
  })
  it("records a verified product name and metal but rejects an unavailable choice", async () => {
    expect((await click(req({ source: "/catalog", productSlug: "ring", product: "Untrusted name", metal: "Silver" }))).status).toBe(200)
    expect(mocks.click).toHaveBeenCalledWith({ data: { source: "/catalog", productSlug: "ring", product: "Real Ring", metal: "Silver", label: null } })
    expect((await click(req({ source: "/catalog", productSlug: "ring", metal: "Gold" }))).status).toBe(400)
  })
  it("reports malformed JSON and database failures honestly", async () => {
    const invalid = () => new Request("http://localhost:3000/", { method: "POST", body: "bad json" })
    expect((await view(invalid())).status).toBe(400)
    expect((await click(invalid())).status).toBe(400)
    mocks.find.mockRejectedValue(new Error("Offline"))
    expect((await view(req({ slug: "ring" }))).status).toBe(503)
  })
})
