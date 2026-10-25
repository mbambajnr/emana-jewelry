import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import ProductGallery from "@/components/ProductGallery"

const images = [{ url: "/gold_signet_ring.jpg", alt: "Front view", sortOrder: 0 }, { url: "/royal_sapphire_ring.jpg", alt: "Side view", sortOrder: 1 }]
describe("Product gallery", () => {
  it("changes the main photo through thumbnails and wraps with the arrows", () => {
    render(<ProductGallery name="Gold Ring" images={images} />)
    fireEvent.click(screen.getByRole("button", { name: "View photo 2 of Gold Ring" }))
    expect(screen.getByRole("img", { name: "Side view" })).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Next photo" }))
    expect(screen.getByRole("img", { name: "Front view" })).toBeInTheDocument()
  })
  it("does not load YouTube until the user explicitly presses play", () => {
    const { container } = render(<ProductGallery name="Gold Ring" images={images} youtubeUrl="https://youtu.be/M7lc1UVf-VE" />)
    expect(container.querySelector("iframe")).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "Watch video of Gold Ring" }))
    expect(container.querySelector("iframe")).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "Play video of Gold Ring" }))
    expect(screen.getByTitle("Gold Ring product video")).toHaveAttribute("src", expect.stringContaining("youtube-nocookie.com/embed/M7lc1UVf-VE"))
    fireEvent.click(screen.getByRole("button", { name: "View photo 1 of Gold Ring" }))
    expect(container.querySelector("iframe")).toBeNull()
  })
  it("opens an enlarged photo and closes it", () => {
    HTMLDialogElement.prototype.showModal = vi.fn(function(this: HTMLDialogElement) { this.setAttribute("open", "") })
    HTMLDialogElement.prototype.close = vi.fn(function(this: HTMLDialogElement) { this.removeAttribute("open") })
    render(<ProductGallery name="Gold Ring" images={images} />)
    fireEvent.click(screen.getByRole("button", { name: "Enlarge photo 1 of Gold Ring" }))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Close enlarged photo" }))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })
  it("handles missing photos and hides invalid videos", () => {
    render(<ProductGallery name="Gold Ring" images={[]} youtubeUrl="https://example.com/not-youtube" />)
    expect(screen.getByText(/Photo coming soon/)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Watch video/ })).not.toBeInTheDocument()
  })
})
