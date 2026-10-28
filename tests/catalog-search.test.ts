import { describe, it, expect } from "vitest"
import { catalogWhere } from "@/lib/catalog-search"
import { catalogHref, catalogQuery } from "@/lib/catalog-navigation"
describe("Catalog search", () => {
  it("supports multiple words, case-insensitive materials, and an optional category", () => {
    const where = catalogWhere("rings", "silver signet")
    expect(where.category).toEqual({ slug: "rings" })
    expect(where.AND).toHaveLength(2)
    expect(JSON.stringify(where)).toContain('"mode":"insensitive"')
    expect(JSON.stringify(where)).toContain('"materials"')
    expect(JSON.stringify(where)).toContain('"stones"')
  })
  it("keeps search through pagination and trims oversized input", () => {
    expect(catalogHref("rings", 2, "silver signet")).toBe("/catalog?q=silver+signet&category=rings&page=2")
    expect(catalogQuery({ q: "  silver   ring  " }).q).toBe("silver ring")
    expect(catalogQuery({ q: "a".repeat(500) }).q).toHaveLength(120)
    expect(catalogWhere("", "")).toEqual({})
  })
})

it("filters by offered metal rather than words in the description", () => {
  expect(catalogWhere("rings", "", "Silver")).toEqual({ category: { slug: "rings" }, metalOptions: { has: "Silver" } })
})
