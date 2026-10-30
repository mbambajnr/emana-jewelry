import "server-only"
import { cacheLife, cacheTag } from "next/cache"
import { emptySocialLinks, parseSocialLinks, type SocialLinks } from "./social-links"

export const SOCIAL_SETTINGS_TAG = "social-settings"
export async function readSocialLinks(): Promise<SocialLinks> {
  const { prisma } = await import("./db")
  const row = await prisma.socialSettings.findUnique({ where: { id: "site" } })
  return row ? parseSocialLinks(row) : emptySocialLinks
}
export async function writeSocialLinks(links: SocialLinks) {
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
