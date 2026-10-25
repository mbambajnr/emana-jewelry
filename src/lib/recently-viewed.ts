const KEY = "emana_recently_viewed"
const MAX = 12
const TTL = 30 * 24 * 60 * 60 * 1000
export interface ViewedProduct { slug: string; viewedAt: number }
export function getRecentlyViewed(): ViewedProduct[] {
  if (typeof window === "undefined") return []
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || "[]")
    if (!Array.isArray(data)) return []
    const seen = new Set<string>()
    return data.filter((item): item is ViewedProduct => {
      if (!item || typeof item.slug !== "string" || !item.slug || item.slug.length > 160 || typeof item.viewedAt !== "number" || !Number.isFinite(item.viewedAt) || item.viewedAt > Date.now() || Date.now() - item.viewedAt > TTL || seen.has(item.slug)) return false
      seen.add(item.slug); return true
    }).slice(0, MAX)
  } catch { return [] }
}
export function recordProductView(slug: string) {
  if (typeof window === "undefined" || !slug || slug.length > 160) return
  try {
    localStorage.setItem(KEY, JSON.stringify([{ slug, viewedAt: Date.now() }, ...getRecentlyViewed().filter(item => item.slug !== slug)].slice(0, MAX)))
    window.dispatchEvent(new Event("recently-viewed"))
  } catch { /* Browsing remains usable when storage is unavailable. */ }
}
export function clearRecentlyViewed() {
  try { localStorage.removeItem(KEY); window.dispatchEvent(new Event("recently-viewed")) } catch { /* Storage may be blocked. */ }
}
