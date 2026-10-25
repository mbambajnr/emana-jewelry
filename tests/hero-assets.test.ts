import { readFileSync, statSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import images from "@/components/remotion/hero-images.json"

describe("hero image transfer budgets", () => {
  it("keeps all three large slides below 350 KB and small slides below 120 KB", () => {
    let largeBytes = 0
    let smallBytes = 0
    for (const image of Object.values(images)) {
      largeBytes += statSync(resolve("public", image.src.slice(1))).size
      const smallest = image.srcSet.split(", ")[0].split(" ")[0]
      smallBytes += statSync(resolve("public", smallest.slice(1))).size
    }
    expect(largeBytes).toBeLessThan(350 * 1024)
    expect(smallBytes).toBeLessThan(120 * 1024)
  })

  it("provides valid WebP files for every responsive candidate", () => {
    for (const image of Object.values(images)) {
      for (const candidate of image.srcSet.split(", ")) {
        const [url, width] = candidate.split(" ")
        const bytes = readFileSync(resolve("public", url.slice(1)))
        expect(bytes.subarray(0, 4).toString()).toBe("RIFF")
        expect(bytes.subarray(8, 12).toString()).toBe("WEBP")
        expect(width).toMatch(/^\d+w$/)
      }
    }
  })
})
