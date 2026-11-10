import { afterEach, expect, it, vi } from "vitest"
import { adminCodeEmail, type AdminCodePurpose } from "@/lib/admin-code-email"
const send = vi.hoisted(() => vi.fn())
vi.mock("@/lib/mail-transport", () => ({ sendEmail: send }))
import { sendAdminLoginCode } from "@/lib/notifications"
afterEach(() => { send.mockReset(); vi.unstubAllEnvs() })
it.each<AdminCodePurpose>(["login", "password-change", "password-reset"])("provides branded HTML and matching plain text for %s", purpose => {
  const message = adminCodeEmail("12345678", new Date("2026-11-10T14:15:00Z"), purpose)
  expect(message.html).toContain("EMANA"); expect(message.html).toContain("12345678")
  expect(message.text).toContain("12345678"); expect(message.text).toContain("02:15 pm GMT")
  expect(message.html).not.toContain("<script"); expect(message.html).not.toContain("<img")
  expect(message.subject).toContain(purpose === "login" ? "sign-in" : purpose === "password-change" ? "password change" : "password reset")
})
it("escapes dynamic HTML and preserves the actual expiry on a resent code", () => {
  const email = adminCodeEmail("<unsafe>", new Date("2026-11-10T23:59:00Z"))
  expect(email.html).toContain("&lt;unsafe&gt;"); expect(email.html).not.toContain("<unsafe>")
  expect(email.text).toContain("11:59 pm GMT"); expect(email.text).not.toContain("10 minutes")
})
it("sends both formats to the configured recipient without changing verification flow", async () => {
  vi.stubEnv("SHOP_NOTIFICATION_EMAIL", "emanajewelries@gmail.com")
  await sendAdminLoginCode("owner@example.invalid", "87654321", new Date("2026-11-10T14:15:00Z"))
  expect(send).toHaveBeenCalledWith(expect.objectContaining({ to: "owner@example.invalid", replyTo: "emanajewelries@gmail.com", html: expect.stringContaining("87654321"), text: expect.stringContaining("87654321") }))
})
