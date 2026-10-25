import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import RemotionHeroSection from "@/components/RemotionHeroSection"

describe("RemotionHeroSection Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("renders the hero section with fallback and call to action links", () => {
    render(<RemotionHeroSection />)

    const openingPhoto = screen.getByRole("img", { name: /goldsmith at work/i })
    expect(openingPhoto).toHaveAttribute("fetchpriority", "high")
    expect(openingPhoto).toHaveAttribute("sizes", "100vw")
    expect(openingPhoto.getAttribute("srcset")).toContain("640w")

    expect(screen.getByRole("link", { name: /Shop Jewelry/i })).toHaveAttribute("href", "/catalog")
    expect(screen.getByRole("link", { name: /Custom Orders/i })).toBeInTheDocument()
  })
})
