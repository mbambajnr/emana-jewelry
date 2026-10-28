vi.mock("@/lib/content-store", () => ({ readPublishedContent: mocks.content }))
import { beforeEach, describe, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({ content: vi.fn(), products: vi.fn(), order: vi.fn(), booking: vi.fn(), list: vi.fn(), admin: vi.fn(), after: vi.fn(), notifyOrder: vi.fn(), confirmOrder: vi.fn(), notifyBooking: vi.fn() }))
vi.mock("@/lib/db", () => ({ prisma: { product: { findMany: mocks.products }, order: { create: mocks.order }, consultation: { create: mocks.booking, findMany: mocks.list } } }))
vi.mock("@/lib/admin-request", () => ({ adminSession: mocks.admin }))
vi.mock("@/lib/notifications", () => ({ sendOrderNotification: mocks.notifyOrder, sendOrderConfirmation: mocks.confirmOrder, sendConsultationNotification: mocks.notifyBooking }))
vi.mock("next/server", async importOriginal => ({ ...await importOriginal<typeof import("next/server")>(), after: mocks.after }))
import { defaultContent } from "@/lib/site-content"
import { POST as inquiry } from "@/app/api/orders/route"
import { POST as appointment, GET as listAppointments } from "@/app/api/consultations/route"
const post = (value: unknown) => new Request("http://localhost:3000/api/test", { method: "POST", body: JSON.stringify(value), headers: { "Content-Type": "application/json" } })
const order = { name: "Ama", email: "ama@example.com", phone: "0241234567", address: "Takoradi", items: [{ slug: "ring", quantity: 2, price: 1, name: "Tampered name" }] }
const booking = { name: "Ama", email: "ama@example.com", service: "Bespoke Design Walkthrough (30 Mins)", format: "Private Atelier (Takoradi - Justmoh Ave)", date: "2099-05-10", notes: "A new ring" }
beforeEach(() => {
  vi.resetAllMocks()
  mocks.content.mockResolvedValue(defaultContent)
  mocks.products.mockResolvedValue([{ slug: "ring", name: "Real Ring", price: 200, images: [{ url: "/ring.jpg" }] }])
  mocks.order.mockResolvedValue({ id: "saved-order" })
  mocks.booking.mockResolvedValue({ ...booking, id: "saved-booking", status: "requested" })
})
describe("Customer inquiry persistence", () => {
  it("uses catalog names and saves an unpriced inquiry regardless of supplied prices", async () => {
    expect((await inquiry(post(order))).status).toBe(201)
    expect(mocks.order).toHaveBeenCalledWith({ data: expect.objectContaining({ total: 0, status: "new", items: [expect.objectContaining({ name: "Real Ring", price: 0, quantity: 2 })] }) })
    expect(mocks.after).toHaveBeenCalledOnce()
  })
  it("saves separate Gold and Silver selections with server catalog names", async () => {
    const response = await inquiry(post({ ...order, items: [{ slug: "ring", quantity: 1, metal: "Gold" }, { slug: "ring", quantity: 2, metal: "Silver" }] }))
    expect(response.status).toBe(201)
    expect(mocks.order).toHaveBeenCalledWith({ data: expect.objectContaining({ items: [expect.objectContaining({ name: "Real Ring", metal: "Gold", quantity: 1 }), expect.objectContaining({ name: "Real Ring", metal: "Silver", quantity: 2 })] }) })
  })
  it("rejects a metal removed from the product before a request is submitted", async () => {
    mocks.products.mockResolvedValue([{ slug: "ring", name: "Real Ring", metalOptions: ["Gold"], images: [] }])
    const response = await inquiry(post({ ...order, items: [{ slug: "ring", quantity: 1, metal: "Silver" }] }))
    expect(response.status).toBe(400)
    expect(mocks.order).not.toHaveBeenCalled()
  })
  it("does not return success or send email after a database failure", async () => {
    mocks.order.mockRejectedValue(new Error("offline"))
    const response = await inquiry(post(order))
    expect(response.status).toBe(503)
    expect(await response.json()).not.toHaveProperty("id")
    expect(mocks.after).not.toHaveBeenCalled()
    expect(mocks.notifyOrder).not.toHaveBeenCalled()
  })
  it("rejects invalid quantities and unknown products", async () => {
    expect((await inquiry(post({ ...order, items: [{ slug: "ring", quantity: -1 }] }))).status).toBe(400)
    mocks.products.mockResolvedValue([])
    expect((await inquiry(post(order))).status).toBe(400)
    expect(mocks.order).not.toHaveBeenCalled()
  })
})
describe("Appointment requests", () => {
  it("saves an appointment as requested, without promising confirmation", async () => {
    const response = await appointment(post(booking))
    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({ ok: true, booking: { id: "saved-booking", status: "requested" } })
    expect(mocks.booking).toHaveBeenCalledWith({ data: expect.objectContaining({ status: "requested" }) })
  })
  it("accepts a newly published service and stores a readable appointment snapshot", async () => {
    mocks.content.mockResolvedValue({ ...defaultContent, services: [{ id: "watch-repair", title: "Watch Repairs", duration: 25, kind: "care", description: "Repairs", enabled: true, bookable: true, showOnHomepage: true }] })
    expect((await appointment(post({ ...booking, service: "watch-repair" }))).status).toBe(201)
    expect(mocks.booking).toHaveBeenCalledWith({ data: expect.objectContaining({ service: "Watch Repairs (25 Mins)" }) })
  })
  it("rejects services that have been unpublished or disabled", async () => {
    mocks.content.mockResolvedValue({ ...defaultContent, services: [] })
    expect((await appointment(post(booking))).status).toBe(400)
    expect(mocks.booking).not.toHaveBeenCalled()
  })
  it("returns an error without a booking reference when persistence fails", async () => {
    mocks.booking.mockRejectedValue(new Error("offline"))
    const response = await appointment(post(booking))
    expect(response.status).toBe(503)
    expect(await response.json()).toMatchObject({ ok: false })
    expect(mocks.after).not.toHaveBeenCalled()
  })
  it("validates email, dates, types, and removed Zoom option", async () => {
    for (const change of [{ email: "bad" }, { date: "2020-01-01" }, { date: "2099-02-31" }, { name: 123 }, { format: "Virtual Consultation (Zoom / Video)" }]) expect((await appointment(post({ ...booking, ...change }))).status).toBe(400)
    expect(mocks.booking).not.toHaveBeenCalled()
  })
  it("does not expose appointment data without admin authorization", async () => {
    mocks.admin.mockResolvedValue(null)
    expect((await listAppointments()).status).toBe(401)
    expect(mocks.list).not.toHaveBeenCalled()
  })
})
