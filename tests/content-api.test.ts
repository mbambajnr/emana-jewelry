import { beforeEach, describe, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({ session: vi.fn(), read: vi.fn(), save: vi.fn(), tag: vi.fn(), path: vi.fn() }))
vi.mock("@/lib/admin-request", () => ({ adminSession: mocks.session, isSameOrigin: (request: Request) => request.headers.get("origin") === new URL(request.url).origin }))
vi.mock("@/lib/content-store", () => ({ readContentEditor: mocks.read, saveContent: mocks.save, CONTENT_TAG: "website-content", ContentConflict: class extends Error {} }))
vi.mock("next/cache", () => ({ revalidateTag: mocks.tag, revalidatePath: mocks.path }))
import { GET, PUT } from "@/app/api/admin/content/route"
const request = (action: string, origin = "http://localhost:3000") => new Request("http://localhost:3000/api/admin/content", { method: "PUT", headers: { "Content-Type": "application/json", origin }, body: JSON.stringify({ action, version: 0, content: {} }) })
beforeEach(() => { vi.resetAllMocks(); mocks.session.mockResolvedValue({ email: "staff@example.com" }); mocks.read.mockResolvedValue({ draft: {}, version: 0 }); mocks.save.mockResolvedValue({ draft: {}, version: 1 }) })
describe("content admin access", () => {
  it("does not expose drafts or accept writes without an admin session", async () => {
    mocks.session.mockResolvedValue(null)
    expect((await GET()).status).toBe(401)
    expect((await PUT(request("save"))).status).toBe(401)
    expect(mocks.read).not.toHaveBeenCalled()
    expect(mocks.save).not.toHaveBeenCalled()
  })
  it("rejects writes from another origin", async () => {
    expect((await PUT(request("save", "https://other.test"))).status).toBe(403)
    expect(mocks.save).not.toHaveBeenCalled()
  })
  it("invalidates the public content only after publishing", async () => {
    expect((await PUT(request("save"))).status).toBe(200)
    expect(mocks.tag).not.toHaveBeenCalled()
    expect((await PUT(request("publish"))).status).toBe(200)
    expect(mocks.tag).toHaveBeenCalledWith("website-content", { expire: 0 })
  })
})
