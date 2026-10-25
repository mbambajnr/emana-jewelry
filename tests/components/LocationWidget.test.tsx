import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import LocationWidget from "@/components/LocationWidget"

describe("LocationWidget Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    })
  })

  it("renders the Takoradi atelier address and venue title", () => {
    render(<LocationWidget />)

    expect(screen.getByText("Visit Our Takoradi Store")).toBeInTheDocument()
    expect(screen.getByText("Emana Jewelry")).toBeInTheDocument()
    expect(screen.getByText("Justmoh Ave, Takoradi")).toBeInTheDocument()
    expect(screen.getByText("Western Region, Ghana")).toBeInTheDocument()
  })

  it("renders the embedded Google Maps iframe with Takoradi address query", () => {
    render(<LocationWidget />)

    const iframe = screen.getByTitle("Emana Jewelry Takoradi Location Map") as HTMLIFrameElement
    expect(iframe).toBeInTheDocument()
    expect(iframe.src).toContain("maps.google.com/maps")
    expect(iframe.src).toContain(encodeURIComponent("Emana Jewelry, Justmoh Ave, Takoradi, Ghana"))
  })

  it("provides Get Directions link pointing to Google Maps directions", () => {
    render(<LocationWidget />)

    const directionsLink = screen.getByRole("link", { name: /Get Directions/i })
    expect(directionsLink).toBeInTheDocument()
    expect(directionsLink.getAttribute("href")).toContain("google.com/maps/dir")
    expect(directionsLink.getAttribute("href")).toContain(encodeURIComponent("Emana Jewelry, Justmoh Ave, Takoradi, Ghana"))
  })

  it("copies address to clipboard when Copy Address button is clicked", async () => {
    render(<LocationWidget />)

    const copyBtn = screen.getByRole("button", { name: /Copy address/i })
    fireEvent.click(copyBtn)

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("Emana Jewelry, Justmoh Ave, Takoradi, Ghana")
      expect(screen.getByText(/Copied!/i)).toBeInTheDocument()
    })
  })
})
