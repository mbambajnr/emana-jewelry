import { describe, expect, it } from "vitest"
import { productMetalOptions, validateMetalOptions } from "@/lib/product-options"
import { quoteItems } from "@/lib/request-validation"

describe("product metal options", () => {
  it("defaults legacy products to both choices and validates admin configuration", () => {
    expect(productMetalOptions()).toEqual(["Gold", "Silver"])
    expect(validateMetalOptions(["Silver"])).toEqual(["Silver"])
    for (const invalid of [[], ["Platinum"], ["Gold", "Gold"], "Gold", null]) expect(() => validateMetalOptions(invalid)).toThrow()
  })
  it("allows the same piece in two metals but rejects duplicate choices", () => {
    expect(quoteItems([{ slug: "ring", quantity: 1, metal: "Gold" }, { slug: "ring", quantity: 2, metal: "Silver" }])).toHaveLength(2)
    expect(() => quoteItems([{ slug: "ring", quantity: 1, metal: "Gold" }, { slug: "ring", quantity: 1, metal: "Gold" }])).toThrow()
    expect(() => quoteItems([{ slug: "ring", quantity: 1, metal: "Platinum" }])).toThrow()
  })
})
