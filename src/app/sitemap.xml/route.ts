import { getSitemap } from "@/lib/sitemap"

const escapeXml = (value: string) => value.replace(/[<>&"']/g, char => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[char]!)

export async function GET() {
  let pages
  try { pages = await getSitemap() }
  catch { return new Response("Sitemap temporarily unavailable", { status: 503, headers: { "Cache-Control": "no-store" } }) }
  const entries = pages.map(page => {
    const modified = page.lastModified ? `<lastmod>${new Date(page.lastModified).toISOString()}</lastmod>` : ""
    return `<url><loc>${escapeXml(page.url)}</loc>${modified}</url>`
  }).join("")
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=3600" } })
}
