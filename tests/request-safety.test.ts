import { afterEach, beforeEach, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({ upsert: vi.fn(), update: vi.fn() }))
vi.mock("@/lib/db", () => ({ prisma: { rateBucket: { upsert: mocks.upsert, update: mocks.update } } }))
import { boundedJson, consumeLimit, trustedClient, submissionIdentity, confirmFingerprint } from "@/lib/request-safety"
beforeEach(() => { vi.resetAllMocks(); vi.stubEnv("SESSION_SECRET", "a-test-secret-at-least-32-characters"); vi.stubEnv("TRUSTED_CLIENT_IP_HEADER", "") })
afterEach(() => vi.unstubAllEnvs())
it("limits attempts using a non-reversible key and handles an insert race", async () => {
  mocks.upsert.mockResolvedValueOnce({ count: 2 }).mockRejectedValueOnce({ code: "P2002" })
  mocks.update.mockResolvedValue({ count: 3 })
  await consumeLimit("login", "private@example.invalid", 2)
  await expect(consumeLimit("login", "private@example.invalid", 2)).rejects.toMatchObject({ status: 429 })
  expect(mocks.upsert.mock.calls[0][0].where.key).not.toContain("private@example.invalid")
})
it("fails closed when the shared limiter database is unavailable", async () => {
  mocks.upsert.mockRejectedValue(new Error("Offline"))
  await expect(consumeLimit("login", "private", 2)).rejects.toMatchObject({ status: 503 })
})
it("does not trust spoofable forwarding headers unless explicitly configured", () => {
  const headers = new Headers({ "x-forwarded-for": "192.0.2.1, 192.0.2.2" })
  expect(trustedClient(headers)).toBeNull()
  vi.stubEnv("TRUSTED_CLIENT_IP_HEADER", "x-forwarded-for")
  expect(trustedClient(headers)).toBe("192.0.2.1")
})
it("bounds streamed JSON and rejects malformed content", async () => {
  const request = (body: string) => new Request("http://localhost/", { method: "POST", headers: { "Content-Type": "application/json" }, body })
  expect(await boundedJson(request('{"name":"Ama"}'))).toEqual({ name: "Ama" })
  await expect(boundedJson(request("x".repeat(100)), 20)).rejects.toMatchObject({ status: 413 })
  await expect(boundedJson(request("null"))).rejects.toMatchObject({ status: 400 })
})
it("requires a stable submission key and detects payload changes", () => {
  const request = new Request("http://localhost/", { headers: { "Idempotency-Key": crypto.randomUUID() } })
  const identity = submissionIdentity(request, { name: "Ama" })
  expect(() => confirmFingerprint({ requestFingerprint: identity.requestFingerprint }, submissionIdentity(request, { name: "Adjoa" }).requestFingerprint)).toThrow()
  expect(() => submissionIdentity(new Request("http://localhost/"), {})).toThrow()
})
