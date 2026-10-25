import { describe, expect, it } from "vitest"
import { catalogHref, catalogQuery, visiblePageNumbers } from "@/lib/catalog-navigation"
describe("Catalog pagination URLs", () => {
  it("keeps filtering optional and encodes category names safely", () => {
    expect(catalogHref("", 1)).toBe("/catalog")
    expect(catalogHref("gold & silver", 2)).toBe("/catalog?category=gold+%26+silver&page=2")
  })
  it("normalizes malformed page values", () => {
    for (const page of ["0", "-1", "abc", "1.5", "Infinity", "99999999999999999999999"]) expect(catalogQuery({ page }).page).toBe(1)
    expect(catalogQuery({ category: "rings", page: "2" })).toEqual({ category: "rings", page: 2, q: "" })
  })
  it("keeps page controls compact for long catalogs", () => {
    expect(visiblePageNumbers(5, 10)).toEqual([1, "gap", 4, 5, 6, "gap", 10])
    expect(visiblePageNumbers(1, 1)).toEqual([1])
  })
})
