import { beforeEach, describe, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({ verify: vi.fn(), read: vi.fn(), save: vi.fn(), revalidate: vi.fn() }))
vi.mock("@/lib/auth", () => ({ verifySession: mocks.verify }))
vi.mock("@/lib/search-settings", () => ({ readSearchSettings: mocks.read, saveSearchSettings: mocks.save, SEARCH_SETTINGS_TAG: "search-settings" }))
vi.mock("next/cache", () => ({ revalidateTag: mocks.revalidate }))
import { GET, PUT } from "@/app/api/admin/seo/route"

const request = (body: unknown, origin = "http://localhost:3000") => new Request("http://localhost:3000/api/admin/seo", { method: "PUT", headers: { origin, "Content-Type": "application/json" }, body: JSON.stringify(body) })
describe("Search settings admin API", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.stubEnv("ADMIN_EMAIL", "admin@example.com")
    mocks.verify.mockResolvedValue({ email: "admin@example.com" })
    mocks.save.mockResolvedValue(undefined)
  })
  it("requires the configured admin for reads and writes", async () => {
    mocks.verify.mockResolvedValue({ email: "someone@example.com" })
    expect((await GET()).status).toBe(401)
    expect((await PUT(request({}))).status).toBe(401)
    expect(mocks.read).not.toHaveBeenCalled()
    expect(mocks.save).not.toHaveBeenCalled()
  })
  it("rejects writes from another origin", async () => {
    expect((await PUT(request({}, "https://example.com"))).status).toBe(403)
    expect(mocks.save).not.toHaveBeenCalled()
  })
  it("saves parsed codes and expires verification metadata", async () => {
    const response = await PUT(request({ googleVerification: '<meta name="google-site-verification" content="test-code">', bingVerification: "ABC123" }))
    expect(response.status).toBe(200)
    expect(mocks.save).toHaveBeenCalledWith({ googleVerification: "test-code", bingVerification: "ABC123" })
    expect(mocks.revalidate).toHaveBeenCalledWith("search-settings", { expire: 0 })
  })
  it("does not report success if persistence fails", async () => {
    mocks.save.mockRejectedValue(new Error("Database unavailable"))
    expect((await PUT(request({ googleVerification: "test", bingVerification: "" }))).status).toBe(503)
    expect(mocks.revalidate).not.toHaveBeenCalled()
  })
})
