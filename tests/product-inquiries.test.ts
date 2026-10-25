import { describe, it, expect } from "vitest"
import { buildProductInquiryConciergeMessage } from "@/lib/concierge"

describe("Simple product WhatsApp inquiry", () => {
  it("includes only the product name, a price question, and a usable product URL", () => {
    expect(buildProductInquiryConciergeMessage("Dollar Sign Necklace", "http://localhost:3000/products/dollar-sign-necklace")).toBe(
      "Hello Emana, I’m interested in the *Dollar Sign Necklace*.\nPlease, how much is it?\n\nhttps://emanajewelry.com/products/dollar-sign-necklace"
    )
  })
  it("keeps the same concise format for different products", () => {
    for (const name of ["Silver Ring", "Emerald Earrings", "Gold Bangle"]) {
      const message = buildProductInquiryConciergeMessage(name)
      expect(message).toContain(`*${name}*`)
      expect(message).not.toMatch(/sizes|delivery|stone options|material|bespoke/i)
      expect(message.split("\n")).toHaveLength(2)
    }
  })
})
