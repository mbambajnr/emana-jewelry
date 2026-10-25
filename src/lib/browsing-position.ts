const KEY = "emana_catalog_position"
export interface BrowsingPosition { path: string; y: number }
export function readBrowsingPosition(): BrowsingPosition | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(KEY) || "null")
    if (!value || typeof value.path !== "string" || !/^\/catalog(?:\?[^#]*)?$/.test(value.path) || !Number.isFinite(value.y) || value.y < 0) return null
    return { path: value.path, y: value.y }
  } catch { return null }
}
export function saveBrowsingPosition(path: string, y: number) {
  if (!/^\/catalog(?:\?[^#]*)?$/.test(path)) return
  try { sessionStorage.setItem(KEY, JSON.stringify({ path, y: Math.max(0, y) })) } catch { /* Optional continuity must not interrupt navigation. */ }
}
