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
  it("does not show Silver photos when Gold photos are missing", () => {
    render(<ProductGallery name="Pendant" metal="Gold" images={[{ url: "/silver.jpg", metal: "Silver", sortOrder: 0 }]} />)
    expect(screen.getByRole("status")).toHaveTextContent("Please ask us for a photo of the Gold version.")
    expect(screen.queryByRole("img")).not.toBeInTheDocument()
  })
  it("puts matching photos before general photos and resets the gallery when metal changes", () => {
    const photos = [{ url: "/general.jpg", alt: "General view", sortOrder: 0 }, { url: "/gold.jpg", alt: "Gold view", metal: "Gold", sortOrder: 2 }, { url: "/silver.jpg", alt: "Silver view", metal: "Silver", sortOrder: 1 }]
    const { rerender } = render(<ProductGallery name="Pendant" metal="Gold" images={photos} />)
    expect(screen.getByRole("img", { name: "Gold view" })).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Next photo" }))
    expect(screen.getByRole("img", { name: "General view" })).toBeInTheDocument()
    rerender(<ProductGallery name="Pendant" metal="Silver" images={photos} />)
    expect(screen.getByRole("img", { name: "Silver view" })).toBeInTheDocument()
  })

  it("keeps a default photo for either metal and clearly labels it as a reference", () => {
    const general = [{ url: "/default.jpg", alt: "Default view", sortOrder: 0 }]
    const { rerender } = render(<ProductGallery name="Pendant" metal="Gold" images={general} />)
    expect(screen.getByRole("img", { name: "Default view" })).toHaveAttribute("src", expect.stringContaining("default.jpg"))
    expect(screen.getByRole("status")).toHaveTextContent("Your enquiry will still include Gold")
    rerender(<ProductGallery name="Pendant" metal="Silver" images={general} />)
    expect(screen.getByRole("img", { name: "Default view" })).toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent("Your enquiry will still include Silver")
  })
  it("identifies general photos even when a matching version is also available", () => {
    render(<ProductGallery name="Pendant" metal="Gold" images={[{ url: "/gold.jpg", metal: "Gold", sortOrder: 0 }, { url: "/default.jpg", sortOrder: 1 }]} />)
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Next photo" }))
    expect(screen.getByRole("status")).toHaveTextContent("General reference photo. Your selected option is Gold.")
  })
  it("does not replace a failed product photo with an unrelated image or invite zooming", () => {
    render(<ProductGallery name="Pendant" metal="Gold" images={[{ url: "/broken.jpg", alt: "Broken view", metal: "Gold", sortOrder: 0 }]} />)
    fireEvent.error(screen.getByRole("img", { name: "Broken view" }))
    expect(screen.getByRole("button", { name: "Enlarge photo 1 of Pendant" })).toBeDisabled()
    expect(screen.getAllByText("Photo unavailable").length).toBeGreaterThan(0)
    expect(screen.queryByText(/Tap the photo for a closer look/)).not.toBeInTheDocument()
  })

})
