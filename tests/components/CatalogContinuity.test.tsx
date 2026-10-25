import { beforeEach, afterEach, describe, expect, it, vi } from "vitest"
import { render, fireEvent, screen } from "@testing-library/react"
vi.mock("next/navigation", () => ({ usePathname: () => "/catalog", useSearchParams: () => new URLSearchParams("category=rings&page=2") }))
import CatalogContinuity from "@/components/CatalogContinuity"
import { saveBrowsingPosition, readBrowsingPosition } from "@/lib/browsing-position"
beforeEach(() => { sessionStorage.clear(); window.history.replaceState({}, "", "/catalog?category=rings&page=2") })
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); window.history.replaceState({}, "", "/") })
describe("Continue catalog browsing", () => {
  it("remembers the search URL and position before opening a product", () => {
    vi.stubGlobal("scrollY", 640)
    const href = `${window.location.origin}/products/ring`
    render(<CatalogContinuity><a href={href} onClick={event => event.preventDefault()}>View ring</a></CatalogContinuity>)
    fireEvent.click(screen.getByRole("link", { name: "View ring" }))
    expect(readBrowsingPosition()).toEqual({ path: "/catalog?category=rings&page=2", y: 640 })
  })
  it("restores only an explicit return after the catalog has rendered", () => {
    saveBrowsingPosition("/catalog?category=rings&page=2", 640)
    window.history.replaceState({}, "", "/catalog?category=rings&page=2#continue-browsing")
    const scroll = vi.spyOn(window, "scrollTo").mockImplementation(() => {})
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(callback => { callback(0); return 1 })
    render(<CatalogContinuity><section data-catalog-grid-ready>Products</section></CatalogContinuity>)
    expect(scroll).toHaveBeenCalledWith({ top: 640, behavior: "instant" })
    expect(window.location.hash).toBe("")
  })
})
