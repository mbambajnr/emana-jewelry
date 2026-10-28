import type { MetalOption } from "./product-options"

export function analyticsAllowed() {
  return typeof navigator !== "undefined" && navigator.doNotTrack !== "1" && !(navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl
}
export function trackProductView(slug: string) {
  if (!analyticsAllowed() || !slug || slug.length > 160) return
  const key = `emana_view_${slug}`
  try {
    const previous = Number(sessionStorage.getItem(key))
    if (previous && Date.now() - previous < 30 * 60 * 1000) return
    sessionStorage.setItem(key, String(Date.now()))
  } catch { return } // Avoid duplicate events when session storage is unavailable.
  fetch("/api/analytics/product-view", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug }), keepalive: true }).catch(() => {})
}
export function productTrackingDetails(url: string, metal?: MetalOption) {
  try {
    const path = new URL(url, "https://emanajewelry.com").pathname
    if (!path.startsWith("/products/")) return {}
    const slug = decodeURIComponent(path.slice("/products/".length))
    return slug && slug.length <= 160 ? { productSlug: slug, metal } : {}
  } catch { return {} }
}
