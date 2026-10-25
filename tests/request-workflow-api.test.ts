import { beforeEach, describe, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({ admin: vi.fn(), authorized: vi.fn(), update: vi.fn(), activity: vi.fn(), history: vi.fn(), transaction: vi.fn() }))
vi.mock("@/lib/admin-request", () => ({ adminSession: mocks.admin, isAdminRequest: mocks.authorized }))
vi.mock("@/lib/db", () => ({ prisma: { $transaction: mocks.transaction, requestActivity: { findMany: mocks.history } } }))
import { GET, PATCH } from "@/app/api/admin/requests/[kind]/[id]/route"
const context = { params: Promise.resolve({ kind: "inquiry", id: "request-1" }) }
const request = (value: unknown) => new Request("http://localhost:3000/api/admin/requests/inquiry/request-1", { method: "PATCH", body: JSON.stringify(value) })
beforeEach(() => {
  vi.resetAllMocks()
  mocks.authorized.mockResolvedValue(true); mocks.admin.mockResolvedValue({ email: "admin@example.com" })
  mocks.update.mockResolvedValue({ count: 1 }); mocks.activity.mockResolvedValue({})
  mocks.transaction.mockImplementation(async callback => callback({ order: { updateMany: mocks.update }, requestActivity: { create: mocks.activity } }))
})
describe("Request stage changes", () => {
  it("protects stage changes and history from unauthenticated access", async () => {
    mocks.authorized.mockResolvedValue(false); mocks.admin.mockResolvedValue(null)
    expect((await PATCH(request({}), context)).status).toBe(401)
    expect((await GET(new Request("http://localhost"), context)).status).toBe(401)
    expect(mocks.transaction).not.toHaveBeenCalled()
  })
  it("updates the expected previous stage and records who changed it", async () => {
    expect((await PATCH(request({ status: "quoted", previous: "contacted", note: "Quote prepared" }), context)).status).toBe(200)
    expect(mocks.update).toHaveBeenCalledWith({ where: { id: "request-1", status: "contacted" }, data: { status: "quoted" } })
    expect(mocks.activity).toHaveBeenCalledWith({ data: expect.objectContaining({ actor: "admin@example.com", fromStatus: "contacted", toStatus: "quoted", note: "Quote prepared" }) })
  })
  it("rejects stale edits without recording an activity", async () => {
    mocks.update.mockResolvedValue({ count: 0 })
    expect((await PATCH(request({ status: "quoted", previous: "new", note: "" }), context)).status).toBe(409)
    expect(mocks.activity).not.toHaveBeenCalled()
  })
  it("rejects unknown stages and reports database failures", async () => {
    expect((await PATCH(request({ status: "nonsense", previous: "new" }), context)).status).toBe(400)
    mocks.transaction.mockRejectedValue(new Error("offline"))
    expect((await PATCH(request({ status: "contacted", previous: "new" }), context)).status).toBe(503)
  })
})
