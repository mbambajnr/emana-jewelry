import { describe, expect, it, vi } from "vitest"
import { defaultContent, validateContent } from "@/lib/site-content"
import { publicServices, servicePageText, servicePath } from "@/lib/service-pages"
vi.mock("@/lib/content-store", () => ({ publishedContent: vi.fn() }))
vi.mock("@/lib/db", () => ({ prisma: { product: { findMany: vi.fn().mockResolvedValue([]) }, category: { findMany: vi.fn().mockResolvedValue([]) } } }))
import { publishedContent } from "@/lib/content-store"
import { getSitemap } from "@/lib/sitemap"
import { SITE_URL } from "@/lib/seo"

describe("service search discovery", () => {
  it("includes enabled published service pages in the sitemap and excludes disabled services", async () => {
    const document = structuredClone(defaultContent)
    document.services[0].enabled = false
    vi.mocked(publishedContent).mockResolvedValue(document)
    const sitemap = await getSitemap()
    const urls = sitemap.map(item => item.url)
    expect(urls).toContain(`${SITE_URL}/services`)
    expect(urls).not.toContain(`${SITE_URL}${servicePath(document.services[0].id)}`)
    for (const service of publicServices(document.services)) expect(urls).toContain(`${SITE_URL}${servicePath(service.id)}`)
  })
  it("keeps CMS page text editable and bounded while supporting older documents", () => {
    const document = structuredClone(defaultContent)
    expect(servicePageText(document.services[0])).toContain("reference photo")
    document.services[0].pageText = "A shop-specific explanation."
    const parsed = validateContent(document, true)
    expect(servicePageText(parsed.services[0])).toBe("A shop-specific explanation.")
    document.services[0].pageText = "x".repeat(6001)
    expect(() => validateContent(document, true)).toThrow(/page details/)
  })
})
