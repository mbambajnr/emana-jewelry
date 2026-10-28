import { beforeEach, describe, expect, it, vi } from "vitest"
import { defaultContent } from "@/lib/site-content"
const state = vi.hoisted(() => ({ row: null as null | { draft: unknown; published: unknown; version: number; publishedAt?: Date }, revisions: [] as { id: string; content: unknown; action: string; actor: string }[] }))
vi.mock("server-only", () => ({}))
vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }))
vi.mock("@/lib/db", () => {
  const tx = {
    siteContent: {
      findUnique: vi.fn(async () => state.row),
      upsert: vi.fn(async ({ create }) => state.row ?? (state.row = structuredClone(create))),
      updateMany: vi.fn(async ({ where, data }) => {
        if (!state.row || state.row.version !== where.version) return { count: 0 }
        state.row = { ...state.row, ...data, version: state.row.version + 1 }
        return { count: 1 }
      }),
    },
    contentRevision: {
      create: vi.fn(async ({ data }) => { state.revisions.push({ ...structuredClone(data), id: `revision-${state.revisions.length}` }); return data }),
      findUnique: vi.fn(async ({ where }) => state.revisions.find(item => item.id === where.id)),
    },
  }
  return { prisma: { ...tx, $transaction: vi.fn(callback => callback(tx)) } }
})
import { ContentConflict, readPublishedContent, saveContent } from "@/lib/content-store"
beforeEach(() => { state.row = null; state.revisions = [] })
describe("CMS publication boundaries", () => {
  it("keeps saved drafts private until they are published", async () => {
    const draft = structuredClone(defaultContent); draft.copy["hero.0.title"] = "Draft heading"
    await saveContent("save", 0, "staff", draft)
    expect((await readPublishedContent()).copy["hero.0.title"]).toBe("Shop")
    await saveContent("publish", 1, "staff")
    expect((await readPublishedContent()).copy["hero.0.title"]).toBe("Draft heading")
    expect(state.revisions.map(item => item.action)).toEqual(["initial", "save", "publish"])
  })
  it("rejects stale tabs instead of overwriting a newer draft", async () => {
    await saveContent("save", 0, "staff", defaultContent)
    await expect(saveContent("save", 0, "other-staff", defaultContent)).rejects.toBeInstanceOf(ContentConflict)
    expect(state.revisions).toHaveLength(2)
  })
  it("restores a revision to draft without replacing the published version", async () => {
    await saveContent("save", 0, "staff", defaultContent)
    const newer = structuredClone(defaultContent); newer.copy["hero.0.title"] = "Live heading"
    await saveContent("save", 1, "staff", newer)
    await saveContent("publish", 2, "staff")
    await saveContent("restore", 3, "staff", undefined, "revision-0")
    expect((await readPublishedContent()).copy["hero.0.title"]).toBe("Live heading")
    expect((state.row?.draft as typeof defaultContent).copy["hero.0.title"]).toBe("Shop")
  })
})
