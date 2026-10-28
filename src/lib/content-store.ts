import "server-only"
import { cacheLife, cacheTag } from "next/cache"
import { prisma } from "./db"
import { defaultContent, validateContent, type SiteDocument } from "./site-content"
import type { Prisma } from "@/generated/prisma/client"
export const CONTENT_TAG = "website-content"
export class ContentConflict extends Error {}
const json = (value: SiteDocument) => value as unknown as Prisma.InputJsonValue

export async function readPublishedContent(): Promise<SiteDocument> {
  const row = await prisma.siteContent.findUnique({ where: { id: "site" } })
  return row ? validateContent(row.published, true) : defaultContent
}
export async function publishedContent(): Promise<SiteDocument> {
  "use cache"
  cacheLife("minutes")
  cacheTag(CONTENT_TAG)
  try { return await readPublishedContent() }
  catch { console.warn("Published website content is unavailable; using the built-in content."); return defaultContent }
}
export async function readContentEditor() {
  const [row, revisions] = await Promise.all([
    prisma.siteContent.findUnique({ where: { id: "site" } }),
    prisma.contentRevision.findMany({ orderBy: { createdAt: "desc" }, take: 20, select: { id: true, action: true, actor: true, createdAt: true } }),
  ])
  return { draft: row ? validateContent(row.draft) : defaultContent, version: row?.version ?? 0, publishedAt: row?.publishedAt ?? null, revisions }
}
export async function saveContent(action: "save" | "publish" | "restore", version: number, actor: string, content?: unknown, revisionId?: string) {
  return prisma.$transaction(async tx => {
    const row = await tx.siteContent.upsert({ where: { id: "site" }, create: { id: "site", draft: json(defaultContent), published: json(defaultContent), version: 0 }, update: {} })
    if (row.version !== version) throw new ContentConflict("This content changed in another tab. Reload the editor before saving.")
    let document: SiteDocument
    if (action === "restore") {
      const revision = revisionId ? await tx.contentRevision.findUnique({ where: { id: revisionId } }) : null
      if (!revision) throw new Error("That revision is no longer available.")
      document = validateContent(revision.content)
    } else document = validateContent(action === "publish" ? row.draft : content, action === "publish")
    if (row.version === 0) await tx.contentRevision.create({ data: { content: row.published as Prisma.InputJsonValue, action: "initial", actor } })
    const result = await tx.siteContent.updateMany({ where: { id: "site", version }, data: { draft: json(document), ...(action === "publish" ? { published: json(document), publishedAt: new Date() } : {}), version: { increment: 1 } } })
    if (result.count !== 1) throw new ContentConflict("This content changed in another tab. Reload the editor before saving.")
    await tx.contentRevision.create({ data: { content: json(document), action, actor } })
    return { draft: document, version: version + 1 }
  })
}
