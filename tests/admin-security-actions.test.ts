import { beforeEach, expect, it, vi } from "vitest"
const mock = vi.hoisted(() => ({ admin: vi.fn(), begin: vi.fn(), finish: vi.fn(), resend: vi.fn(), cancel: vi.fn(), limit: vi.fn(), set: vi.fn(), signout: vi.fn(), redirect: vi.fn(), token: "b".repeat(64) }))
vi.mock("@/lib/auth", () => ({ requireAdmin: mock.admin, deleteSession: mock.signout }))
vi.mock("@/lib/admin-password-change", () => ({ beginPasswordChange: mock.begin, completePasswordChange: mock.finish }))
vi.mock("@/lib/admin-otp", () => ({ resendAdminOtp: mock.resend, cancelAdminOtp: mock.cancel, OtpError: class extends Error { constructor(message: string, public restart = false) { super(message) } } }))
vi.mock("@/lib/request-safety", () => ({ consumeLimit: mock.limit, RequestError: class extends Error {} }))
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => ({ value: mock.token }), set: mock.set }) }))
vi.mock("next/navigation", () => ({ redirect: mock.redirect }))
import { changePassword } from "@/app/actions/security"
import { OtpError } from "@/lib/admin-otp"
const form = (fields: Record<string, string>) => { const value = new FormData(); Object.entries(fields).forEach(([key, field]) => value.set(key, field)); return value }
beforeEach(() => {
  vi.resetAllMocks(); mock.admin.mockResolvedValue({ email: "owner@example.invalid" }); mock.begin.mockResolvedValue({ token: mock.token, expiresAt: new Date(Date.now() + 600000) })
  mock.redirect.mockImplementation(() => { throw new Error("redirect-login") })
})
it("requires an authenticated admin before any password operation", async () => {
  mock.admin.mockRejectedValue(new Error("Sign in required"))
  await expect(changePassword(undefined, form({ intent: "begin" }))).rejects.toThrow("Sign in required")
  expect(mock.begin).not.toHaveBeenCalled(); expect(mock.finish).not.toHaveBeenCalled()
})
it("returns only the code step, keeping new passwords and pending tokens off the response", async () => {
  const result = await changePassword(undefined, form({ intent: "begin", currentPassword: "old-password", newPassword: "new-private-password", confirmPassword: "new-private-password" }))
  expect(result.step).toBe("code"); expect(JSON.stringify(result)).not.toContain("new-private-password"); expect(JSON.stringify(result)).not.toContain(mock.token)
  expect(mock.finish).not.toHaveBeenCalled(); expect(mock.signout).not.toHaveBeenCalled()
})
it("uses the browser cookie and server-staged password rather than a submitted replacement", async () => {
  await expect(changePassword(undefined, form({ intent: "verify", code: "12345678", newPassword: "attacker-replacement" }))).rejects.toThrow("redirect-login")
  expect(mock.finish).toHaveBeenCalledWith(mock.token, "12345678")
  expect(mock.signout).toHaveBeenCalledOnce()
})
it("does not sign out or report success if the confirmation fails", async () => {
  mock.finish.mockRejectedValue(new OtpError("Expired", true))
  expect(await changePassword(undefined, form({ intent: "verify", code: "12345678" }))).toMatchObject({ step: "password", error: "Expired" })
  expect(mock.signout).not.toHaveBeenCalled(); expect(mock.redirect).not.toHaveBeenCalled()
})
