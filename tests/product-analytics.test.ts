import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { trackProductView, productTrackingDetails } from "@/lib/product-analytics"
import { trackConciergeClick } from "@/lib/concierge"
beforeEach(() => { sessionStorage.clear(); vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}")) })
afterEach(() => { vi.restoreAllMocks(); Reflect.deleteProperty(navigator, "doNotTrack"); Reflect.deleteProperty(navigator, "globalPrivacyControl"); vi.useRealTimers() })
describe("Product analytics", () => {
  it("limits repeated views for 30 minutes without sending a visitor identifier", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-28T10:00:00Z"))
    trackProductView("ring"); trackProductView("ring")
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body))).toEqual({ slug: "ring" })
    vi.advanceTimersByTime(30 * 60 * 1000)
    trackProductView("ring")
    expect(fetch).toHaveBeenCalledTimes(2)
  })
  it("respects both browser privacy signals", () => {
    Object.defineProperty(navigator, "doNotTrack", { configurable: true, value: "1" })
    trackProductView("ring"); trackConciergeClick("/catalog")
    expect(fetch).not.toHaveBeenCalled()
  })
  it("respects Global Privacy Control", () => {
    Object.defineProperty(navigator, "globalPrivacyControl", { configurable: true, value: true })
    trackProductView("ring"); trackConciergeClick("/catalog")
    expect(fetch).not.toHaveBeenCalled()
    Reflect.deleteProperty(navigator, "globalPrivacyControl")
  })
  it("tracks the stable slug and metal while removing queries and fragments from source", () => {
    const details = productTrackingDetails("/products/cross%26hands?metal=Silver", "Silver")
    trackConciergeClick("/catalog?q=private#piece", "Enquire", "Cross", details)
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body))).toEqual({ source: "/catalog", label: "Enquire", product: "Cross", productSlug: "cross&hands", metal: "Silver" })
    expect(productTrackingDetails("/catalog")).toEqual({})
  })
})
