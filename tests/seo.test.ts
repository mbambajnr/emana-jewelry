import { describe, expect, it } from "vitest"
import { absoluteUrl, businessSchema, jsonLdString, pageMetadata, SITE_URL } from "@/lib/seo"

describe("Search metadata", () => {
  it("keeps each public page canonical and share URL aligned", () => {
    const metadata = pageMetadata("Our collections", "Gold jewelry made in Ghana", "/collections")
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/collections`)
    expect(metadata.openGraph?.url).toBe(`${SITE_URL}/collections`)
  })

  it("resolves local images without corrupting external image URLs", () => {
    expect(absoluteUrl("/logo.png")).toBe(`${SITE_URL}/logo.png`)
    expect(absoluteUrl("https://images.example.com/ring.jpg")).toBe("https://images.example.com/ring.jpg")
  })

  it("keeps JSON-LD valid and prevents embedded text closing the script tag", () => {
    const data = { name: "Gold </script><script>alert(1)</script>" }
    const serialized = jsonLdString(data)
    expect(serialized).not.toContain("<")
    expect(JSON.parse(serialized)).toEqual(data)
    expect(JSON.parse(jsonLdString(businessSchema))["@type"]).toBe("JewelryStore")
  })
})
