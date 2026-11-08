import { beforeEach, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({ set: vi.fn(), issue: vi.fn().mockResolvedValue("signed-token") }))
vi.mock("next/headers", () => ({ cookies: async () => ({ set: mocks.set }) }))
vi.mock("@/lib/session-token", () => ({ issueAdminToken: mocks.issue, readAdminToken: vi.fn() }))
vi.mock("@/lib/admin-credentials", () => ({ readAdminPasswordHash: async () => "current-verifier" }))
import { createSession } from "@/lib/auth"
beforeEach(() => { vi.clearAllMocks() })
it.each([false, true])("sets the signed expiry and cookie consistently, remember=%s", async remember => {
  const now = Date.now()
  await createSession("owner@example.invalid", "current-verifier", remember)
  const expiresAt = mocks.issue.mock.calls[0][1]
  expect(expiresAt).toBeGreaterThanOrEqual(now + (remember ? 168 : 12) * 3600000)
  expect(expiresAt).toBeLessThanOrEqual(Date.now() + (remember ? 168 : 12) * 3600000)
  expect(mocks.set).toHaveBeenCalledWith("admin_session", "signed-token", expect.objectContaining({ expires: new Date(expiresAt), httpOnly: true, sameSite: "lax", path: "/" }))
})
