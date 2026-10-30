import { beforeEach, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({ find: vi.fn(), update: vi.fn(), order: vi.fn(), send: vi.fn(), confirmation: vi.fn(), booking: vi.fn(), clean: vi.fn() }))
vi.mock("@/lib/db", () => ({ prisma: { notificationJob: { findMany: mocks.find, updateMany: mocks.update }, order: { findUnique: mocks.order }, rateBucket: { deleteMany: mocks.clean } } }))
vi.mock("@/lib/notifications", () => ({ sendOrderNotification: mocks.send, sendOrderConfirmation: mocks.confirmation, sendConsultationNotification: mocks.booking }))
import { processNotifications } from "@/lib/notification-jobs"
beforeEach(() => { vi.resetAllMocks(); mocks.find.mockResolvedValue([{ id: "job", kind: "order-owner", recordId: "order", attempts: 0 }]); mocks.update.mockResolvedValue({ count: 1 }); mocks.order.mockResolvedValue({ id: "order", items: [] }); mocks.send.mockResolvedValue(undefined) })
it("uses a stable provider idempotency key and records acceptance", async () => {
  expect(await processNotifications()).toEqual({ sent: 1, failed: 0 })
  expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ id: "order" }), "notification/job")
  expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: "job", lockToken: expect.any(String) }), data: expect.objectContaining({ status: "sent", lastError: null }) }))
})
it("persists a retry after provider failure without exposing provider errors", async () => {
  mocks.send.mockRejectedValue(new Error("Sensitive provider error"))
  expect(await processNotifications()).toEqual({ sent: 0, failed: 1 })
  expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "pending", nextAttemptAt: expect.any(Date), lastError: expect.not.stringContaining("Sensitive") }) }))
})
it("does not send a job another worker has claimed", async () => {
  mocks.update.mockResolvedValue({ count: 0 })
  expect(await processNotifications()).toEqual({ sent: 0, failed: 0 })
  expect(mocks.send).not.toHaveBeenCalled()
})
