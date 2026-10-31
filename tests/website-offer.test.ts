import { describe, expect, it } from "vitest"
import { defaultContent, validateContent } from "@/lib/site-content"
import { websiteDiscount, offerRecord } from "@/lib/website-offer"
import { buildOrderConciergeMessage, buildProductInquiryConciergeMessage, buildServiceConciergeMessage } from "@/lib/concierge"

describe("website jewelry discount", () => {
  it("defaults to ten percent and can be disabled in the CMS", () => {
    const document = structuredClone(defaultContent)
    expect(websiteDiscount(validateContent(document, true).copy)).toBe(10)
    document.copy["offer.percent"] = ""
    expect(websiteDiscount(validateContent(document, true).copy)).toBeNull()
    for (const invalid of ["-10", "101", "10%", "0", "10.5"]) {
      document.copy["offer.percent"] = invalid
      expect(() => validateContent(document, true)).toThrow(/percentage/)
    }
  })
  it("carries the offer into jewelry enquiries without offering service discounts or fake prices", () => {
    expect(buildProductInquiryConciergeMessage("Pendant", "/products/pendant", "Silver", 10)).toContain("10% website discount")
    expect(buildOrderConciergeMessage({ items: [{ name: "Pendant", quantity: 1 }], discountPercent: 10 })).toContain("10% website discount")
    expect(buildServiceConciergeMessage("Repairs")).not.toContain("discount")
    expect(offerRecord(10)).toContain("confirmed jewelry price")
  })
})
