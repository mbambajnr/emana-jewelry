import "server-only"
import { prisma } from "./db"
import { sendOrderConfirmation, sendOrderNotification, sendConsultationNotification } from "./notifications"
import type { CartItem } from "./cart"

export const orderJobs = (recordId: string) => ["order-owner", "order-customer"].map(kind => ({ kind, recordId }))
export const consultationJobs = (recordId: string) => [{ kind: "consultation-owner", recordId }]
export async function processNotifications(limit = 10, recordId?: string) {
  const now = new Date(), scope = recordId ? { recordId } : {}
  await prisma.notificationJob.updateMany({ where: { ...scope, status: "working", attempts: { gte: 5 }, lockedUntil: { lt: now } }, data: { status: "failed", lockedUntil: null, lockToken: null, lastError: "Delivery stopped after an interrupted final attempt. Review before retrying." } })
  const eligible = { ...scope, attempts: { lt: 5 }, OR: [{ status: "pending", nextAttemptAt: { lte: now } }, { status: "working", lockedUntil: { lt: now } }] }
  const jobs = await prisma.notificationJob.findMany({ where: eligible, take: Math.min(limit, 50), orderBy: { nextAttemptAt: "asc" } })
  let sent = 0, failed = 0
  for (const job of jobs) {
    const lockToken = crypto.randomUUID()
    const claimed = await prisma.notificationJob.updateMany({ where: { id: job.id, ...eligible }, data: { status: "working", lockToken, lockedUntil: new Date(Date.now() + 120000), attempts: { increment: 1 } } })
    if (claimed.count !== 1) continue
    try {
      const idempotencyKey = `notification/${job.id}`
      if (job.kind.startsWith("order-")) {
        const order = await prisma.order.findUnique({ where: { id: job.recordId } })
        if (!order) throw new Error("Record unavailable")
        const snapshot = { ...order, items: order.items as unknown as CartItem[] }
        if (job.kind === "order-owner") await sendOrderNotification(snapshot, idempotencyKey)
        else if (job.kind === "order-customer") await sendOrderConfirmation(snapshot, idempotencyKey)
        else throw new Error("Unknown notification")
      } else if (job.kind === "consultation-owner") {
        const booking = await prisma.consultation.findUnique({ where: { id: job.recordId } })
        if (!booking) throw new Error("Record unavailable")
        await sendConsultationNotification(booking, idempotencyKey)
      } else throw new Error("Unknown notification")
      await prisma.notificationJob.updateMany({ where: { id: job.id, lockToken }, data: { status: "sent", lockToken: null, lockedUntil: null, lastError: null } })
      sent++
    } catch {
      failed++
      await prisma.notificationJob.updateMany({ where: { id: job.id, lockToken }, data: { status: job.attempts + 1 >= 5 ? "failed" : "pending", lockToken: null, lockedUntil: null, lastError: "Delivery could not be confirmed. Check the email connection and retry.", nextAttemptAt: new Date(Date.now() + Math.min(60, 2 ** (job.attempts + 1)) * 60000) } })
    }
  }
  await prisma.rateBucket.deleteMany({ where: { expiresAt: { lt: new Date(Date.now() - 86400000) } } })
  return { sent, failed }
}
