import "server-only"
import { readFile, mkdir, rename, writeFile } from "node:fs/promises"
import path from "node:path"
import { cacheLife, cacheTag } from "next/cache"
import { verificationToken, type SearchVerification } from "./search-verification"

const localFile = path.join(process.cwd(), ".data", "search-settings.json")
export const SEARCH_SETTINGS_TAG = "search-settings"
const defaults: SearchVerification = { googleVerification: "", bingVerification: "" }

export async function readSearchSettings(): Promise<SearchVerification> {
  // Development settings stay on this machine; production uses durable Postgres storage.
  if (process.env.NODE_ENV !== "production") {
    try {
      const settings = JSON.parse(await readFile(localFile, "utf8"))
      return { googleVerification: verificationToken(settings.googleVerification, "google"), bingVerification: verificationToken(settings.bingVerification, "bing") }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return defaults
      throw error
    }
  }
  const { prisma } = await import("./db")
  const settings = await prisma.searchSettings.findUnique({ where: { id: "site" } })
  return settings ? { googleVerification: settings.googleVerification, bingVerification: settings.bingVerification } : defaults
}

export async function saveSearchSettings(settings: SearchVerification) {
  if (process.env.NODE_ENV !== "production") {
    await mkdir(path.dirname(localFile), { recursive: true })
    const temporaryFile = `${localFile}.${crypto.randomUUID()}.tmp`
    await writeFile(temporaryFile, JSON.stringify(settings), { mode: 0o600 })
    await rename(temporaryFile, localFile)
    return
  }
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
