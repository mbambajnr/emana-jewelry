import { afterEach, beforeEach, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({ password: vi.fn(), session: vi.fn(), removeSession: vi.fn(), start: vi.fn(), verify: vi.fn(), resend: vi.fn(), cancel: vi.fn(), limit: vi.fn(), set: vi.fn(), clear: vi.fn(), redirect: vi.fn(), after: [] as (() => Promise<void>)[], token: "b".repeat(64) }))
vi.mock("next/headers", () => ({ headers: async () => new Headers(), cookies: async () => ({ get: () => ({ value: mocks.token }), set: mocks.set, delete: mocks.clear }) }))
vi.mock("next/server", () => ({ after: (callback: () => Promise<void>) => mocks.after.push(callback) }))
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }))
vi.mock("@/lib/auth", () => ({ verifyPassword: mocks.password, createSession: mocks.session, deleteSession: mocks.removeSession }))
vi.mock("@/lib/admin-credentials", () => ({ readAdminPasswordHash: async () => process.env.ADMIN_PASSWORD_HASH }))
vi.mock("@/lib/admin-otp", () => ({ startAdminOtp: mocks.start, verifyAdminOtp: mocks.verify, resendAdminOtp: mocks.resend, cancelAdminOtp: mocks.cancel, OTP_LIFETIME: 600000, OtpError: class extends Error { constructor(message: string, public restart = false) { super(message) } } }))
vi.mock("@/lib/request-safety", () => ({ consumeLimit: mocks.limit, trustedClient: () => null, RequestError: class extends Error {} }))
import { login } from "@/app/actions/auth"
import { OtpError } from "@/lib/admin-otp"
const form = (values: Record<string, string>) => { const data = new FormData(); Object.entries(values).forEach(([key, value]) => data.set(key, value)); return data }
beforeEach(() => {
  vi.resetAllMocks(); mocks.after.length = 0; vi.stubEnv("ADMIN_EMAIL", "owner@example.invalid"); vi.stubEnv("ADMIN_PASSWORD_HASH", "test-password-verifier")
  mocks.password.mockResolvedValue(true); mocks.start.mockResolvedValue({ token: mocks.token, expiresAt: new Date(Date.now() + 600000) })
  mocks.redirect.mockImplementation(() => { throw new Error("redirect-to-admin") })
})
afterEach(() => vi.unstubAllEnvs())
it("requests a browser-bound code using email alone without creating a session", async () => {
  const state = await login(undefined, form({ email: " OWNER@example.invalid " }))
  expect(state.step).toBe("code"); expect(mocks.session).not.toHaveBeenCalled()
  expect(mocks.start).not.toHaveBeenCalled()
  expect(mocks.set).toHaveBeenCalledWith("admin_login_challenge", expect.stringMatching(/^[a-f0-9]{64}$/), expect.objectContaining({ httpOnly: true, sameSite: "strict", path: "/admin" }))
  await mocks.after[0]()
  expect(mocks.start).toHaveBeenCalledWith("login", undefined, undefined, expect.stringMatching(/^[a-f0-9]{64}$/))
  expect(mocks.password).not.toHaveBeenCalled()
})
it("returns the same public response for unknown addresses without emailing them", async () => {
  const known = await login(undefined, form({ email: "owner@example.invalid" }))
  const unknown = await login(undefined, form({ email: "someone@example.invalid" }))
  expect(unknown).toEqual(known)
  await mocks.after[1]()
  expect(mocks.start).not.toHaveBeenCalled(); expect(mocks.session).not.toHaveBeenCalled()
})
it("rejects malformed addresses before sending", async () => {
  expect((await login(undefined, form({ email: "bad" }))).step).toBe("email")
  expect(mocks.after).toHaveLength(0)
})
it.each([false, true])("creates a session only after OTP verification, remembered=%s", async remember => {
  mocks.verify.mockResolvedValue("owner@example.invalid")
  await expect(login(undefined, form({ intent: "verify", code: "12345678", ...(remember ? { remember: "on" } : {}) }))).rejects.toThrow("redirect-to-admin")
  expect(mocks.verify).toHaveBeenCalledWith(mocks.token, "12345678")
  expect(mocks.session).toHaveBeenCalledWith("owner@example.invalid", "test-password-verifier", remember)
})
it("does not trust client state or allow failed codes to create sessions", async () => {
  mocks.verify.mockRejectedValue(new OtpError("Expired", true))
  expect(await login({ step: "verified" }, form({ intent: "verify", code: "12345678" }))).toMatchObject({ step: "email", error: "Expired" })
  expect(mocks.session).not.toHaveBeenCalled()
  expect(mocks.set).toHaveBeenCalledWith("admin_login_challenge", "", expect.objectContaining({ maxAge: 0 }))
})
it("resends asynchronously and fails closed if email delivery fails", async () => {
  expect((await login(undefined, form({ intent: "resend" }))).step).toBe("code")
  await mocks.after[0]()
  expect(mocks.resend).toHaveBeenCalledWith(mocks.token)
  mocks.start.mockRejectedValue(new Error("Provider failure"))
  await login(undefined, form({ email: "owner@example.invalid" }))
  await mocks.after[1]()
  expect(mocks.session).not.toHaveBeenCalled()
})
it("does not send or issue cookies when rate limited", async () => {
  mocks.limit.mockRejectedValue(new Error("limited"))
  expect((await login(undefined, form({ email: "owner@example.invalid" }))).step).toBe("email")
  expect(mocks.after).toHaveLength(0); expect(mocks.set).not.toHaveBeenCalled()
})
