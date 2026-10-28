import { describe, expect, it, vi } from "vitest"
vi.mock("@/lib/auth", () => ({ verifySession: vi.fn() }))
import { isSameOrigin } from "@/lib/admin-request"
describe("admin write origins", () => {
  it("uses the actual request host when Next normalizes the internal URL", () => {
    const request = new Request("http://localhost:3001/api/admin/content", { headers: { host: "127.0.0.1:3001", origin: "http://127.0.0.1:3001" } })
    expect(isSameOrigin(request)).toBe(true)
  })
  it("rejects foreign, missing, and malformed origins", () => {
    for (const origin of ["https://other.test", "null", "bad origin", ""]) expect(isSameOrigin(new Request("https://shop.test/admin", { headers: { host: "shop.test", origin } }))).toBe(false)
  })
})
