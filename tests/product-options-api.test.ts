import { beforeEach, describe, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({ admin: vi.fn(), create: vi.fn(), update: vi.fn() }))
vi.mock("@/lib/admin-request", () => ({ isAdminRequest: mocks.admin }))
vi.mock("@/lib/db", () => ({ prisma: { product: { create: mocks.create, update: mocks.update } } }))
import { POST } from "@/app/api/admin/products/route"
import { PUT } from "@/app/api/admin/products/[id]/route"
const request = (body: unknown, method = "POST") => new Request("http://localhost:3000/api/admin/products", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
const params = { params: Promise.resolve({ id: "piece" }) }
beforeEach(() => { vi.resetAllMocks(); mocks.admin.mockResolvedValue(true); mocks.create.mockResolvedValue({ id: "piece" }); mocks.update.mockResolvedValue({ id: "piece" }) })

describe("admin product metal settings", () => {
  it("persists configured choices and defaults new products to both metals", async () => {
    expect((await POST(request({ metalOptions: ["Silver"] }))).status).toBe(201)
    expect(mocks.create).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.objectContaining({ metalOptions: ["Silver"] }) }))
    await POST(request({}))
    expect(mocks.create).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.objectContaining({ metalOptions: ["Gold", "Silver"] }) }))
  })
  it("leaves options unchanged when an older update does not supply them", async () => {
    await PUT(request({}, "PUT"), params)
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ metalOptions: undefined }) }))
  })
  it("rejects empty or invalid options before saving", async () => {
    for (const metalOptions of [[], ["Gold", "Gold"], ["Platinum"]]) {
      expect((await POST(request({ metalOptions }))).status).toBe(400)
      expect((await PUT(request({ metalOptions }, "PUT"), params)).status).toBe(400)
    }
    expect(mocks.create).not.toHaveBeenCalled()
    expect(mocks.update).not.toHaveBeenCalled()
  })
  it("requires an admin session to change choices", async () => {
    mocks.admin.mockResolvedValue(false)
    expect((await POST(request({ metalOptions: ["Gold"] }))).status).toBe(401)
    expect(mocks.create).not.toHaveBeenCalled()
  })
  it("saves photo metal labels and rejects unsupported photo labels", async () => {
    expect((await POST(request({ images: [{ url: "/gold.jpg", metal: "Gold" }] }))).status).toBe(201)
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ images: { create: [expect.objectContaining({ metal: "Gold" })] } }) }))
    mocks.create.mockClear()
    expect((await POST(request({ images: [{ url: "/bad.jpg", metal: "Blue" }] }))).status).toBe(400)
    expect(mocks.create).not.toHaveBeenCalled()
  })

})

describe("product information", () => {
  it("stores notes, trims text, and keeps legacy availability in sync", async () => {
    const body = { availabilityStatus: "made_to_order", sizeNotes: "  45 cm chain  ", deliveryNotes: "Ask about delivery", careInstructions: "Use a soft cloth" }
    expect((await POST(request(body))).status).toBe(201)
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ ...body, sizeNotes: "45 cm chain", available: false }) }))
    expect((await PUT(request({ availabilityStatus: "available", careInstructions: "" }, "PUT"), params)).status).toBe(200)
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ available: true, careInstructions: null }) }))
  })
  it("rejects invalid statuses and oversized or non-text notes before writing", async () => {
    for (const body of [{ availabilityStatus: "in_stock" }, { sizeNotes: 42 }, { deliveryNotes: "x".repeat(1001) }, { careInstructions: [] }]) {
      expect((await POST(request(body))).status).toBe(400)
      expect((await PUT(request(body, "PUT"), params)).status).toBe(400)
    }
    expect(mocks.create).not.toHaveBeenCalled()
    expect(mocks.update).not.toHaveBeenCalled()
  })
  it("preserves information omitted by an older editor", async () => {
    await PUT(request({}, "PUT"), params)
    const data = mocks.update.mock.calls[0][0].data
    expect(data).not.toHaveProperty("sizeNotes")
    expect(data).not.toHaveProperty("availabilityStatus")
    expect(data.available).toBeUndefined()
  })
})
