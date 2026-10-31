import { afterAll, expect, it, vi } from "vitest"
const send = vi.hoisted(() => ({ owner: vi.fn(), client: vi.fn(), consultation: vi.fn() }))
vi.mock("@/lib/content-store", async () => ({ readPublishedContent: async () => (await import("@/lib/site-content")).defaultContent }))
vi.mock("@/lib/notifications", () => ({ sendOrderNotification: send.owner, sendOrderConfirmation: send.client, sendConsultationNotification: send.consultation }))
vi.mock("@/lib/admin-request", async original => ({ ...await original<typeof import("@/lib/admin-request")>(), isAdminRequest: async () => true }))
vi.mock("@/lib/request-safety", async original => ({ ...await original<typeof import("@/lib/request-safety")>(), publicGuard: vi.fn() }))
vi.mock("next/server", async original => ({ ...await original<typeof import("next/server")>(), after: vi.fn() }))
import type { PrismaClient } from "@/generated/prisma/client"
let database: PrismaClient | undefined

const run = process.env.RUN_MYSQL_INTEGRATION === "1"
afterAll(async () => { if (database) await database.$disconnect() })
it.skipIf(!run)("verifies shared throttling, idempotent enquiries, product conflicts, and durable email retries on MySQL", async () => {
  const { prisma } = await import("@/lib/db"); database = prisma
  const { POST: submit } = await import("@/app/api/orders/route")
  const { PUT: updateProduct } = await import("@/app/api/admin/products/[id]/route")
  const { consumeLimit } = await import("@/lib/request-safety")
  const { processNotifications } = await import("@/lib/notification-jobs")
  const marker = `hardening-${crypto.randomUUID()}`, requestKey = crypto.randomUUID()
  let categoryId: string | undefined
  try {
    const attempts = await Promise.all(Array.from({ length: 12 }, () => consumeLimit(marker, "test-client", 5).then(() => true).catch(error => { expect(error.status).toBe(429); return false })))
    expect(attempts.filter(Boolean)).toHaveLength(5)
    const category = await prisma.category.create({ data: { slug: marker, name: "Verification only", description: "Verification only", image: "/logo.png" } }); categoryId = category.id
    const product = await prisma.product.create({ data: { slug: marker, sku: marker, name: "Verification pendant", description: "A verification piece", categoryId, price: 0, metalOptions: ["Gold", "Silver"], images: { create: { url: "/logo.png", metal: "Silver" } } } })
    const body = { name: "Verification only", email: "test@example.invalid", phone: "0000000000", address: "Verification only", items: [{ slug: marker.toUpperCase(), quantity: 1, metal: "Silver" }] }
    const request = (value = body) => new Request("http://localhost:3000/api/orders", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": requestKey }, body: JSON.stringify(value) })
    const first = await submit(request()); expect(first.status).toBe(201)
    const saved = await first.json()
    expect((await submit(request())).status).toBe(201)
    expect(await prisma.order.count({ where: { requestKey } })).toBe(1)
    expect(await prisma.notificationJob.count({ where: { recordId: saved.id } })).toBe(2)
    expect((await submit(request({ ...body, address: "Changed" }))).status).toBe(409)
    const edit = (version: number, name: string) => new Request("http://localhost:3000/api/admin/products/test", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ version, name }) })
    expect((await updateProduct(edit(0, "Updated verification pendant"), { params: Promise.resolve({ id: product.id }) })).status).toBe(200)
    expect((await updateProduct(edit(0, "Stale overwrite"), { params: Promise.resolve({ id: product.id }) })).status).toBe(409)
    expect(await prisma.productImage.count({ where: { productId: product.id } })).toBe(1)
    expect((await prisma.product.findUnique({ where: { id: product.id } }))?.name).toBe("Updated verification pendant")
    send.owner.mockRejectedValueOnce(new Error("Provider unavailable")).mockResolvedValue(undefined)
    send.client.mockResolvedValue(undefined)
    expect(await processNotifications(10, saved.id)).toEqual({ sent: 1, failed: 1 })
    const waiting = await prisma.notificationJob.findFirst({ where: { recordId: saved.id, kind: "order-owner" } })
    expect(waiting).toMatchObject({ status: "pending", attempts: 1 })
    expect(waiting!.nextAttemptAt.getTime()).toBeGreaterThan(Date.now())
    await prisma.notificationJob.updateMany({ where: { recordId: saved.id, status: "pending" }, data: { nextAttemptAt: new Date(0) } })
    await Promise.all([processNotifications(10, saved.id), processNotifications(10, saved.id)])
    expect(send.owner).toHaveBeenCalledTimes(2) // First failed attempt plus one successful retry.
    expect(send.client).toHaveBeenCalledTimes(1)
    expect(await prisma.notificationJob.count({ where: { recordId: saved.id, status: "sent" } })).toBe(2)
  } finally {
    const orders = await prisma.order.findMany({ where: { requestKey }, select: { id: true } })
    await prisma.notificationJob.deleteMany({ where: { recordId: { in: orders.map(order => order.id) } } })
    await prisma.order.deleteMany({ where: { requestKey } })
    if (categoryId) { await prisma.product.deleteMany({ where: { categoryId } }); await prisma.category.delete({ where: { id: categoryId } }) }
    await prisma.rateBucket.deleteMany({ where: { key: { startsWith: marker + ":" } } })
  }
}, 30000)
