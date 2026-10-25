import { describe, it, expect } from "vitest"
import { normalizeYoutubeUrl, youtubeVideoId } from "@/lib/product-media"

describe("Product YouTube links", () => {
  it("accepts watch, share, shorts, live, and privacy-enhanced embed URLs", () => {
    for (const url of ["https://www.youtube.com/watch?v=M7lc1UVf-VE&t=10", "https://youtu.be/M7lc1UVf-VE", "https://www.youtube.com/shorts/M7lc1UVf-VE", "https://www.youtube.com/live/M7lc1UVf-VE", "https://www.youtube-nocookie.com/embed/M7lc1UVf-VE"]) {
      expect(youtubeVideoId(url)).toBe("M7lc1UVf-VE")
      expect(normalizeYoutubeUrl(url)).toBe("https://www.youtube.com/watch?v=M7lc1UVf-VE")
    }
  })
  it("rejects other domains, invalid IDs, and executable URLs", () => {
    for (const url of ["https://youtube.com.attacker.com/watch?v=M7lc1UVf-VE", "javascript:alert(1)", "https://youtube.com/watch?v=bad", "https://example.com/M7lc1UVf-VE"]) {
      expect(youtubeVideoId(url)).toBeNull()
      expect(() => normalizeYoutubeUrl(url)).toThrow()
    }
  })
  it("allows products without video", () => {
    expect(normalizeYoutubeUrl("")).toBeNull()
    expect(normalizeYoutubeUrl(null)).toBeNull()
  })
})
