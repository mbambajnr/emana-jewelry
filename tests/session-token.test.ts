import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { issueAdminToken, readAdminToken } from "@/lib/session-token"
beforeEach(() => { vi.stubEnv("SESSION_SECRET", "a-long-test-secret-with-at-least-32-characters"); vi.stubEnv("ADMIN_EMAIL", "owner@example.invalid"); vi.stubEnv("ADMIN_PASSWORD_HASH", "salt:old-test-verifier") })
afterEach(() => vi.unstubAllEnvs())
it("invalidates a previously issued session after the password verifier changes", async () => {
  const token = await issueAdminToken("owner@example.invalid", Date.now() + 60000)
  expect(await readAdminToken(token)).toEqual({ email: "owner@example.invalid" })
  vi.stubEnv("ADMIN_PASSWORD_HASH", "salt:new-test-verifier")
  expect(await readAdminToken(token)).toBeNull()
  expect(await readAdminToken(await issueAdminToken("owner@example.invalid", Date.now() + 60000))).not.toBeNull()
})
it("rejects expired, tampered, malformed and different-owner tokens", async () => {
  expect(await readAdminToken(await issueAdminToken("owner@example.invalid", Date.now() - 1000))).toBeNull()
  expect(await readAdminToken(await issueAdminToken("other@example.invalid", Date.now() + 60000))).toBeNull()
  const token = await issueAdminToken("owner@example.invalid", Date.now() + 60000)
  expect(await readAdminToken(token + ".extra")).toBeNull()
  expect(await readAdminToken("x" + token)).toBeNull()
})
it("supports UTF-8 email addresses in the signed payload", async () => {
  vi.stubEnv("ADMIN_EMAIL", "adjoa+é@example.invalid")
  expect(await readAdminToken(await issueAdminToken("adjoa+é@example.invalid", Date.now() + 60000))).toEqual({ email: "adjoa+é@example.invalid" })
})
