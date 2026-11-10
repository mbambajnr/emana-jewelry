import { afterEach, expect, it, vi } from "vitest"
const send = vi.hoisted(() => vi.fn())
vi.mock("@/lib/mail-transport", () => ({ sendEmail: send }))
import { sendOrderNotification, sendOrderConfirmation } from "@/lib/notifications"
const order = { id: "fixture-order", name: "Test", email: "customer@example.invalid", phone: "000", address: "Test", notes: null, total: 0, items: [] }
afterEach(() => { vi.unstubAllEnvs(); send.mockClear() })
it("uses the configured shop inbox, falling back to the admin inbox", async () => {
  vi.stubEnv("ADMIN_EMAIL", "admin@example.invalid"); vi.stubEnv("SHOP_NOTIFICATION_EMAIL", "shop@example.invalid")
  await sendOrderNotification(order); expect(send).toHaveBeenLastCalledWith(expect.objectContaining({ to: "shop@example.invalid" }), undefined)
  vi.stubEnv("SHOP_NOTIFICATION_EMAIL", "")
  await sendOrderNotification(order); expect(send).toHaveBeenLastCalledWith(expect.objectContaining({ to: "admin@example.invalid" }), undefined)
})
it("fails closed if neither inbox is configured", async () => {
  vi.stubEnv("ADMIN_EMAIL", ""); vi.stubEnv("SHOP_NOTIFICATION_EMAIL", "")
  await expect(sendOrderNotification(order)).rejects.toThrow(/notification email/); expect(send).not.toHaveBeenCalled()
})

it("routes customer replies to the shop and shop replies to the customer", async () => {
  vi.stubEnv("SHOP_NOTIFICATION_EMAIL", "emanajewelries@gmail.com")
  await sendOrderConfirmation(order)
  expect(send).toHaveBeenLastCalledWith(expect.objectContaining({ to: order.email, replyTo: "emanajewelries@gmail.com" }), undefined)
  await sendOrderNotification(order)
  expect(send).toHaveBeenLastCalledWith(expect.objectContaining({ to: "emanajewelries@gmail.com", replyTo: order.email }), undefined)
})
