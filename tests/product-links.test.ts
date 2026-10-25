import { describe, expect, it } from "vitest"
import { decodeProductSlug } from "@/lib/product-links"

describe("Product URL references", () => {
  it("finds the original product reference after URL encoding", () => {
    for (const slug of ["iced-out-cross&praying-hands-pendant-necklace", "Silver-Horseshoe-Pendant-Necklace", "ring-with-space here", "necklace#one", "pendant?style=one", "100%25", "bijou-étoile"]) expect(decodeProductSlug(encodeURIComponent(slug))).toBe(slug)
  })
  it("keeps already readable slugs unchanged and tolerates malformed encoding", () => {
    expect(decodeProductSlug("teddy-bear")).toBe("teddy-bear")
    expect(decodeProductSlug("ring%bad")).toBe("ring%bad")
  })
})
