import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { getRecentlyViewed, recordProductView } from "@/lib/recently-viewed"
import RecentlyViewed from "@/components/RecentlyViewed"
beforeEach(() => { vi.restoreAllMocks(); localStorage.clear() })
describe("Recently viewed customer controls", () => {
  it("shows current product data and clears the local history on request", async () => {
    recordProductView("ring")
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify([{ id: "1", slug: "ring", name: "Silver Ring", images: [] }]), { status: 200 }))
    render(<RecentlyViewed />)
    await waitFor(() => expect(screen.getByRole("link", { name: "View Silver Ring" })).toBeInTheDocument())
    fireEvent.click(screen.getByRole("button", { name: "Clear history" }))
    expect(getRecentlyViewed()).toEqual([])
    expect(screen.queryByRole("heading", { name: "Recently viewed" })).not.toBeInTheDocument()
  })
  it("does not fetch or render an empty history", async () => {
    const fetch = vi.spyOn(globalThis, "fetch")
    const { container } = render(<RecentlyViewed />)
    expect(container).toBeEmptyDOMElement()
    await new Promise(resolve => setTimeout(resolve, 10))
    expect(fetch).not.toHaveBeenCalled()
  })
})
