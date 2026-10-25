import { describe, it, expect } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import ProductCardImage from "@/components/ProductCardImage"

describe("Product hover photo", () => {
  it("keeps the cover and makes the second photo available only after loading", async () => {
    const { container } = render(<ProductCardImage name="Ring" images={[{ url: "/gold_signet_ring.jpg" }, { url: "/royal_sapphire_ring.jpg" }]} sizes="25vw" />)
    expect(screen.getByRole("img", { name: "Ring" })).toBeInTheDocument()
    const second = container.querySelector('[data-product-alternate]')!
    expect(second).toHaveAttribute("data-product-alternate", "loading")
    fireEvent.load(second)
    await waitFor(() => expect(second).toHaveAttribute("data-product-alternate", "ready"))
    fireEvent.error(second)
    expect(second).toHaveAttribute("data-product-alternate", "loading")
  })
  it("keeps single-photo and duplicate-photo products unchanged", () => {
    const { container, rerender } = render(<ProductCardImage name="Ring" images={[{ url: "/gold_signet_ring.jpg" }]} sizes="25vw" />)
    expect(container.querySelectorAll("img")).toHaveLength(1)
    rerender(<ProductCardImage name="Ring" images={[{ url: "/gold_signet_ring.jpg" }, { url: "/gold_signet_ring.jpg" }]} sizes="25vw" />)
    expect(container.querySelectorAll("img")).toHaveLength(1)
  })
})

describe("Mobile product card photos", () => {
  const photos = [{ url: "/gold_signet_ring.jpg", alt: "Front view" }, { url: "/royal_sapphire_ring.jpg", alt: "Side view" }, { url: "/diamond_bracelet.jpg", alt: "Detail view" }]
  it("swipes through every photo and wraps around", () => {
    render(<ProductCardImage name="Ring" images={photos} sizes="100vw" />)
    const frame = screen.getByTestId("product-card-photos")
    const left = () => { fireEvent.touchStart(frame, { touches: [{ clientX: 200, clientY: 100 }] }); fireEvent.touchEnd(frame, { changedTouches: [{ clientX: 80, clientY: 105 }] }) }
    left()
    expect(screen.getByRole("img", { name: "Side view" })).toBeInTheDocument()
    expect(screen.getByLabelText(/Photo 2 of 3/)).toBeInTheDocument()
    left()
    expect(screen.getByRole("img", { name: "Detail view" })).toBeInTheDocument()
    left()
    expect(screen.getByRole("img", { name: "Front view" })).toBeInTheDocument()
  })
  it("preserves vertical scrolling and normal taps, but blocks a swipe from opening the product", () => {
    const { container } = render(<a href="https://example.com/products/ring"><ProductCardImage name="Ring" images={photos} sizes="100vw" /></a>)
    const frame = screen.getByTestId("product-card-photos")
    fireEvent.touchStart(frame, { touches: [{ clientX: 150, clientY: 100 }] })
    fireEvent.touchEnd(frame, { changedTouches: [{ clientX: 155, clientY: 220 }] })
    expect(screen.getByRole("img", { name: "Front view" })).toBeInTheDocument()
    // Inspect cancelation without actually navigating in jsdom.
    const tap = new MouseEvent("click", { bubbles: true, cancelable: true })
    let linkClicks = 0
    container.querySelector("a")!.addEventListener("click", event => { linkClicks++; event.preventDefault() })
    fireEvent(frame, tap)
    expect(linkClicks).toBe(1)
    fireEvent.touchStart(frame, { touches: [{ clientX: 200, clientY: 100 }] })
    fireEvent.touchEnd(frame, { changedTouches: [{ clientX: 60, clientY: 100 }] })
    const swipeClick = new MouseEvent("click", { bubbles: true, cancelable: true })
    fireEvent(frame, swipeClick)
    expect(swipeClick.defaultPrevented).toBe(true)
    expect(linkClicks).toBe(1)
  })
})
