import { afterEach, beforeEach, expect, it, vi } from "vitest"
const mock = vi.hoisted(() => ({ start: vi.fn(), resend: vi.fn(), cancel: vi.fn(), finish: vi.fn(), limit: vi.fn(), signout: vi.fn(), notice: vi.fn(), set: vi.fn(), after: vi.fn(), jobs: [] as Array<() => Promise<void>>, token: "c".repeat(64) }))
vi.mock("next/headers", () => ({ headers: async () => new Headers(), cookies: async () => ({ get: () => ({ value: mock.token }), set: mock.set }) }))
vi.mock("next/server", () => ({ after: (job: () => Promise<void>) => { mock.after(); mock.jobs.push(job) } }))
vi.mock("@/lib/admin-otp", () => ({ startAdminOtp: mock.start, resendAdminOtp: mock.resend, cancelAdminOtp: mock.cancel, OTP_LIFETIME: 600000 }))
vi.mock("@/lib/admin-password-reset", () => ({ completePasswordReset: mock.finish }))
vi.mock("@/lib/auth", () => ({ deleteSession: mock.signout }))
vi.mock("@/lib/notifications", () => ({ sendAdminPasswordResetNotice: mock.notice }))
vi.mock("@/lib/request-safety", () => ({ consumeLimit: mock.limit, trustedClient: () => null, RequestError: class extends Error {} }))
import { resetPassword } from "@/app/actions/password-reset"
const form = (fields: Record<string, string>) => { const data = new FormData(); Object.entries(fields).forEach(([key, value]) => data.set(key, value)); return data }
beforeEach(() => { vi.resetAllMocks(); mock.jobs.length = 0; vi.stubEnv("ADMIN_EMAIL", "owner@example.invalid") })
afterEach(() => vi.unstubAllEnvs())
it("returns identical recovery responses and cookie settings before looking up either address", async () => {
  const known = await resetPassword(undefined, form({ intent: "begin", email: "owner@example.invalid" }))
  const unknown = await resetPassword(undefined, form({ intent: "begin", email: "other@example.invalid" }))
  expect(known).toEqual(unknown); expect(known.step).toBe("code"); expect(mock.start).not.toHaveBeenCalled()
  expect(mock.set).toHaveBeenCalledWith("admin_password_reset", mock.token, expect.objectContaining({ httpOnly: true, sameSite: "strict", path: "/admin" }))
  expect(JSON.stringify(known)).not.toContain(mock.token)
  await mock.jobs[0](); await mock.jobs[1]()
  expect(mock.start).toHaveBeenCalledOnce()
  expect(mock.start).toHaveBeenCalledWith("password-reset", undefined, undefined, mock.token)
  expect(mock.finish).not.toHaveBeenCalled(); expect(mock.signout).not.toHaveBeenCalled()
})
it("validates passwords consistently without consuming a code", async () => {
  const state = await resetPassword(undefined, form({ intent: "verify", code: "12345678", newPassword: "short", confirmPassword: "short" }))
  expect(state.step).toBe("code"); expect(state.error).toContain("12")
  expect(mock.finish).not.toHaveBeenCalled()
})
it("does not expose whether a failed code belongs to a real request", async () => {
  mock.finish.mockRejectedValueOnce(new Error("Wrong code")).mockRejectedValueOnce(new Error("Unknown request"))
  const value = { intent: "verify", code: "12345678", newPassword: "A long new password!", confirmPassword: "A long new password!" }
  expect(await resetPassword(undefined, form(value))).toEqual(await resetPassword(undefined, form(value)))
  expect(mock.signout).not.toHaveBeenCalled(); expect(mock.notice).not.toHaveBeenCalled()
})
it("requires a valid reset before clearing sessions and sends a notice without the password", async () => {
  const state = await resetPassword(undefined, form({ intent: "verify", code: "12345678", newPassword: "A long new password!", confirmPassword: "A long new password!" }))
  expect(state.step).toBe("done")
  expect(mock.finish).toHaveBeenCalledWith(mock.token, "12345678", "A long new password!", "A long new password!")
  expect(mock.signout).toHaveBeenCalledOnce()
  expect(JSON.stringify(state)).not.toContain("A long new password!")
  await mock.jobs[0]()
  expect(mock.notice).toHaveBeenCalledWith("owner@example.invalid")
})
it("uses the same public response for resend requests, without waiting for transport", async () => {
  const state = await resetPassword(undefined, form({ intent: "resend" }))
  expect(state.step).toBe("code"); expect(mock.resend).not.toHaveBeenCalled()
  await mock.jobs[0](); expect(mock.resend).toHaveBeenCalledWith(mock.token, "password-reset")
})
