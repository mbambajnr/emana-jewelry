import { afterEach, beforeEach, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({ password: vi.fn(), session: vi.fn(), removeSession: vi.fn(), start: vi.fn(), verify: vi.fn(), resend: vi.fn(), cancel: vi.fn(), limit: vi.fn(), set: vi.fn(), clear: vi.fn(), redirect: vi.fn(), token: "b".repeat(64) }))
vi.mock("next/headers", () => ({ headers: async () => new Headers(), cookies: async () => ({ get: () => ({ value: mocks.token }), set: mocks.set, delete: mocks.clear }) }))
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }))
vi.mock("@/lib/auth", () => ({ verifyPassword: mocks.password, createSession: mocks.session, deleteSession: mocks.removeSession }))
vi.mock("@/lib/admin-otp", () => ({ startAdminOtp: mocks.start, verifyAdminOtp: mocks.verify, resendAdminOtp: mocks.resend, cancelAdminOtp: mocks.cancel, OtpError: class extends Error { constructor(message: string, public restart = false) { super(message) } } }))
vi.mock("@/lib/request-safety", () => ({ consumeLimit: mocks.limit, trustedClient: () => null, RequestError: class extends Error {} }))
import { login } from "@/app/actions/auth"
import { OtpError } from "@/lib/admin-otp"
const form = (values: Record<string, string>) => { const data = new FormData(); Object.entries(values).forEach(([key, value]) => data.set(key, value)); return data }
beforeEach(() => {
  vi.resetAllMocks(); vi.stubEnv("ADMIN_EMAIL", "owner@example.invalid"); vi.stubEnv("ADMIN_PASSWORD_HASH", "test-password-verifier")
  mocks.password.mockResolvedValue(true); mocks.start.mockResolvedValue({ token: mocks.token, expiresAt: new Date(Date.now() + 600000) })
  mocks.redirect.mockImplementation(() => { throw new Error("redirect-to-admin") })
})
afterEach(() => vi.unstubAllEnvs())
it("does not create an admin session from a correct password alone", async () => {
  const state = await login(undefined, form({ email: "owner@example.invalid", password: "password" }))
  expect(state.step).toBe("code"); expect(mocks.session).not.toHaveBeenCalled(); expect(mocks.redirect).not.toHaveBeenCalled()
  expect(mocks.set).toHaveBeenCalledWith("admin_login_challenge", mocks.token, expect.objectContaining({ httpOnly: true, sameSite: "strict", path: "/admin" }))
  expect(JSON.stringify(state)).not.toContain(mocks.token)
})
it("does not send a code for invalid credentials", async () => {
  mocks.password.mockResolvedValue(false)
  expect((await login(undefined, form({ email: "owner@example.invalid", password: "wrong" }))).step).toBe("password")
  expect(mocks.start).not.toHaveBeenCalled(); expect(mocks.session).not.toHaveBeenCalled()
})
it("creates the session only after the browser-bound OTP succeeds", async () => {
  mocks.verify.mockResolvedValue("owner@example.invalid")
  await expect(login({ step: "password" }, form({ intent: "verify", code: "12345678" }))).rejects.toThrow("redirect-to-admin")
  expect(mocks.verify).toHaveBeenCalledWith(mocks.token, "12345678")
  expect(mocks.session).toHaveBeenCalledWith("owner@example.invalid")
})
it("does not trust client step state or allow failed codes to create sessions", async () => {
  mocks.verify.mockRejectedValue(new OtpError("Expired", true))
  expect(await login({ step: "verified" }, form({ intent: "verify", code: "12345678" }))).toMatchObject({ step: "password", error: "Expired" })
  expect(mocks.session).not.toHaveBeenCalled(); expect(mocks.set).toHaveBeenCalledWith("admin_login_challenge", "", expect.objectContaining({ maxAge: 0, path: "/admin" }))
})
it("resends without creating a session and fails closed if email delivery fails", async () => {
  expect((await login(undefined, form({ intent: "resend" }))).step).toBe("code")
  expect(mocks.resend).toHaveBeenCalledWith(mocks.token); expect(mocks.session).not.toHaveBeenCalled()
  mocks.start.mockRejectedValue(new Error("Provider failure"))
  expect((await login(undefined, form({ email: "owner@example.invalid", password: "password" }))).step).toBe("password")
  expect(mocks.session).not.toHaveBeenCalled()
})
