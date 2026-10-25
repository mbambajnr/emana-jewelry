import { beforeEach, afterEach, describe, it, expect, vi } from "vitest"
import { getRecentlyViewed, recordProductView, clearRecentlyViewed } from "@/lib/recently-viewed"
import { saveBrowsingPosition, readBrowsingPosition } from "@/lib/browsing-position"
beforeEach(() => { localStorage.clear(); sessionStorage.clear() })
afterEach(() => vi.restoreAllMocks())
describe("Local browsing memory", () => {
  it("keeps the newest view first, without duplicates and with a bounded history", () => {
    for (let index = 0; index < 15; index++) recordProductView(`piece-${index}`)
    recordProductView("piece-10")
    expect(getRecentlyViewed()).toHaveLength(12)
    expect(getRecentlyViewed()[0].slug).toBe("piece-10")
    expect(getRecentlyViewed().filter(item => item.slug === "piece-10")).toHaveLength(1)
  })
  it("expires old entries and handles malformed storage", () => {
    localStorage.setItem("emana_recently_viewed", JSON.stringify([{ slug: "old", viewedAt: Date.now() - 31 * 86400000 }, { slug: "current", viewedAt: Date.now() }]))
    expect(getRecentlyViewed().map(item => item.slug)).toEqual(["current"])
    localStorage.setItem("emana_recently_viewed", "bad json")
    expect(getRecentlyViewed()).toEqual([])
  })
  it("can be cleared and does not break when browser storage is unavailable", () => {
    recordProductView("ring"); clearRecentlyViewed(); expect(getRecentlyViewed()).toEqual([])
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked") })
    expect(() => recordProductView("ring")).not.toThrow()
  })
  it("stores only local catalog return positions", () => {
    saveBrowsingPosition("/catalog?q=silver&category=rings&page=2", 820)
    expect(readBrowsingPosition()).toEqual({ path: "/catalog?q=silver&category=rings&page=2", y: 820 })
    sessionStorage.setItem("emana_catalog_position", JSON.stringify({ path: "https://example.com", y: 10 }))
    expect(readBrowsingPosition()).toBeNull()
  })
})
