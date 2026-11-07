import { afterEach, beforeEach, expect, it, vi } from "vitest"
const mock = vi.hoisted(() => ({ smtp: vi.fn(), resend: vi.fn(), transport: vi.fn(), close: vi.fn() }))
vi.mock("nodemailer", () => ({ default: { createTransport: mock.transport } }))
vi.mock("resend", () => ({ Resend: class { emails = { send: mock.resend } } }))
import { sendEmail } from "@/lib/mail-transport"
import { assertEmailConfigured, smtpSettings } from "@/lib/mail-config"
const payload = { from: "Emana <notifications@emanajewelry.com>", to: "owner@example.invalid", subject: "Admin code", text: "Verification message" }
beforeEach(() => {
  vi.resetAllMocks()
  vi.stubEnv("EMAIL_PROVIDER", "smtp"); vi.stubEnv("SMTP_HOST", "smtp.gmail.com"); vi.stubEnv("SMTP_PORT", "465"); vi.stubEnv("SMTP_SECURE", "true")
  vi.stubEnv("SMTP_USER", "owner@gmail.com"); vi.stubEnv("SMTP_PASS", "test app password"); vi.stubEnv("SMTP_FROM", "Emana <owner@gmail.com>")
  mock.transport.mockReturnValue({ sendMail: mock.smtp, close: mock.close }); mock.smtp.mockResolvedValue({ accepted: [payload.to], rejected: [] })
})
afterEach(() => vi.unstubAllEnvs())
it("uses Gmail SMTP and the authenticated sender without requiring a Resend key", async () => {
  vi.stubEnv("RESEND_API_KEY", "")
  await sendEmail(payload)
  expect(mock.transport).toHaveBeenCalledWith(expect.objectContaining({ host: "smtp.gmail.com", port: 465, secure: true, tls: { rejectUnauthorized: true, minVersion: "TLSv1.2" } }))
  expect(mock.smtp).toHaveBeenCalledWith(expect.objectContaining({ ...payload, from: "Emana <owner@gmail.com>" }))
  expect(mock.resend).not.toHaveBeenCalled(); expect(mock.close).toHaveBeenCalled()
})
it("requires STARTTLS on port 587 and rejects mismatched TLS settings", () => {
  vi.stubEnv("SMTP_PORT", "587"); vi.stubEnv("SMTP_SECURE", "false")
  expect(smtpSettings().options).toMatchObject({ secure: false, requireTLS: true, tls: { rejectUnauthorized: true } })
  vi.stubEnv("SMTP_SECURE", "true")
  expect(() => smtpSettings()).toThrow(/STARTTLS/)
})
it("fails closed when SMTP credentials are missing instead of falling back to Resend", async () => {
  vi.stubEnv("SMTP_PASS", ""); vi.stubEnv("RESEND_API_KEY", "a-configured-resend-key")
  expect(() => assertEmailConfigured()).toThrow(/SMTP_PASS/)
  await expect(sendEmail(payload)).rejects.toThrow()
  expect(mock.resend).not.toHaveBeenCalled(); expect(mock.smtp).not.toHaveBeenCalled()
})
it("does not expose credentials, provider responses, or message contents on SMTP failures", async () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
  mock.smtp.mockRejectedValue(Object.assign(new Error("private address/password/message"), { code: "EAUTH" }))
  await expect(sendEmail(payload)).rejects.toThrow("Email delivery failed")
  expect(warn).toHaveBeenCalledWith("SMTP email delivery failed: EAUTH")
  expect(mock.close).toHaveBeenCalled(); expect(mock.resend).not.toHaveBeenCalled()
  warn.mockRestore()
})
it("rejects failed recipients and supplies a stable message ID for outbox retries", async () => {
  await sendEmail(payload, "same-job")
  const first = mock.smtp.mock.calls[0][0].messageId
  await sendEmail(payload, "same-job")
  expect(mock.smtp.mock.calls[1][0].messageId).toBe(first)
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
  mock.smtp.mockResolvedValue({ accepted: [], rejected: [payload.to] })
  await expect(sendEmail(payload)).rejects.toThrow("Email delivery failed")
  warn.mockRestore()
})
it("keeps Resend available only when explicitly selected", async () => {
  vi.stubEnv("EMAIL_PROVIDER", "resend"); vi.stubEnv("RESEND_API_KEY", "test-key")
  mock.resend.mockResolvedValue({ data: { id: "test" }, error: null })
  await sendEmail(payload, "same-job")
  expect(mock.resend).toHaveBeenCalledWith(payload, { idempotencyKey: "same-job" })
  expect(mock.smtp).not.toHaveBeenCalled()
})
