import "server-only"
import { cacheLife, cacheTag } from "next/cache"
import { type SearchVerification } from "./search-verification"

export const SEARCH_SETTINGS_TAG = "search-settings"
const defaults: SearchVerification = { googleVerification: "", bingVerification: "" }

export async function readSearchSettings(): Promise<SearchVerification> {
  const { prisma } = await import("./db")
  const settings = await prisma.searchSettings.findUnique({ where: { id: "site" } })
  return settings ? { googleVerification: settings.googleVerification, bingVerification: settings.bingVerification } : defaults
}

export async function saveSearchSettings(settings: SearchVerification) {
  const { prisma } = await import("./db")
  await prisma.searchSettings.upsert({ where: { id: "site" }, create: { id: "site", ...settings }, update: settings })
}

export async function searchVerificationMetadata() {
  "use cache"
  cacheTag(SEARCH_SETTINGS_TAG)
  cacheLife("minutes")
  try {
    const settings = await readSearchSettings()
    return {
      ...(settings.googleVerification ? { google: settings.googleVerification } : {}),
      ...(settings.bingVerification ? { other: { "msvalidate.01": settings.bingVerification } } : {}),
    }
  } catch {
    console.warn("Search verification settings unavailable.")
    return {}
  }
}
