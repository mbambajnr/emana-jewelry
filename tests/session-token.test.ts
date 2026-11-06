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
it("rejects previously signed sessions that predate email verification", async () => {
  const fresh = await issueAdminToken("owner@example.invalid", Date.now() + 60000)
  const payload = JSON.parse(Buffer.from(fresh.split(".")[0], "base64url").toString())
  delete payload.authentication
  const data = Buffer.from(JSON.stringify(payload))
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(process.env.SESSION_SECRET!), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  const signature = Buffer.from(await crypto.subtle.sign("HMAC", key, data)).toString("base64url")
  expect(await readAdminToken(`${data.toString("base64url")}.${signature}`)).toBeNull()
})
