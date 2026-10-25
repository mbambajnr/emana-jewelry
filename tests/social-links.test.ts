import { describe, it, expect } from "vitest"
import { normalizeSocialLink, parseSocialLinks } from "@/lib/social-links"

describe("Social profile links", () => {
  it("accepts the correct platform and preserves profile paths", () => {
    expect(normalizeSocialLink(" https://www.instagram.com/emana/ ", "instagram")).toBe("https://www.instagram.com/emana/")
    expect(normalizeSocialLink("https://www.facebook.com/profile.php?id=123", "facebook")).toContain("id=123")
    expect(normalizeSocialLink("https://www.tiktok.com/@emana", "tiktok")).toBe("https://www.tiktok.com/@emana")
  })
  it("rejects unsafe URLs, platform mixups, and platform homepages", () => {
    for (const url of ["javascript:alert(1)", "http://instagram.com/emana", "https://instagram.com.attacker.com/emana", "https://www.facebook.com/emana", "https://user:pass@instagram.com/emana", "https://instagram.com/"]) {
      expect(() => normalizeSocialLink(url, "instagram")).toThrow()
    }
  })
  it("allows clearing links and rejects missing fields", () => {
    expect(parseSocialLinks({ instagram: "", facebook: "", tiktok: "" })).toEqual({ instagram: "", facebook: "", tiktok: "" })
    expect(() => parseSocialLinks({ instagram: "" })).toThrow()
  })
})
