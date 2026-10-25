export const socialPlatforms = ["instagram", "facebook", "tiktok"] as const
export type SocialPlatform = typeof socialPlatforms[number]
export type SocialLinks = Record<SocialPlatform, string>
export const emptySocialLinks: SocialLinks = { instagram: "", facebook: "", tiktok: "" }
const hosts: Record<SocialPlatform, string[]> = {
  instagram: ["instagram.com", "www.instagram.com"],
  facebook: ["facebook.com", "www.facebook.com", "m.facebook.com"],
  tiktok: ["tiktok.com", "www.tiktok.com"],
}
export function normalizeSocialLink(value: unknown, platform: SocialPlatform): string {
  if (typeof value !== "string") throw new Error(`Please enter a ${platform} profile link or leave it blank.`)
  if (!value.trim()) return ""
  try {
    if (value.length > 2048) throw new Error()
    const url = new URL(value.trim())
    if (url.protocol !== "https:" || !hosts[platform].includes(url.hostname) || url.username || url.password || url.port || url.pathname === "/") throw new Error()
    return url.toString()
  } catch { throw new Error(`Please use a full https:// profile link from ${platform}.`) }
}
export function parseSocialLinks(value: unknown): SocialLinks {
  if (!value || typeof value !== "object") throw new Error("Please check your social links.")
  const body = value as Record<string, unknown>
  return Object.fromEntries(socialPlatforms.map(platform => [platform, normalizeSocialLink(body[platform], platform)])) as SocialLinks
}
