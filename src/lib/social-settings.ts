import "server-only"
import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import path from "node:path"
import { cacheLife, cacheTag } from "next/cache"
import { emptySocialLinks, parseSocialLinks, type SocialLinks } from "./social-links"

export const SOCIAL_SETTINGS_TAG = "social-settings"
const file = path.join(process.cwd(), ".data", "social-links.json")
export async function readSocialLinks(): Promise<SocialLinks> {
  if (process.env.NODE_ENV !== "production") {
    try { return parseSocialLinks(JSON.parse(await readFile(file, "utf8"))) }
    catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return emptySocialLinks; throw error }
  }
  const { prisma } = await import("./db")
  const row = await prisma.socialSettings.findUnique({ where: { id: "site" } })
  return row ? parseSocialLinks(row) : emptySocialLinks
}
export async function writeSocialLinks(links: SocialLinks) {
  if (process.env.NODE_ENV !== "production") {
    await mkdir(path.dirname(file), { recursive: true })
    const temporaryFile = `${file}.${crypto.randomUUID()}.tmp`
    await writeFile(temporaryFile, JSON.stringify(links), { mode: 0o600 })
    await rename(temporaryFile, file)
    return
  }
  const { prisma } = await import("./db")
  await prisma.socialSettings.upsert({ where: { id: "site" }, create: { id: "site", ...links }, update: links })
}
export async function publicSocialLinks(): Promise<SocialLinks> {
  "use cache"
  cacheTag(SOCIAL_SETTINGS_TAG)
  cacheLife("minutes")
  try { return await readSocialLinks() }
  catch { console.warn("Social links unavailable."); return emptySocialLinks }
}
