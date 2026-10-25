import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { WhatsappButton } from "@/components/WhatsappButton"

describe("WhatsappButton Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(window, "open").mockImplementation(() => null)
  })

  it("renders with default accessibility label", () => {
    render(<WhatsappButton productName="Sapphire Crown" productUrl="/products/sapphire-crown" />)

    const btn = screen.getByRole("button", { name: /Inquire about Sapphire Crown on WhatsApp/i })
    expect(btn).toBeInTheDocument()
  })

  it("renders with custom label if provided", () => {
    render(
      <WhatsappButton
        productName="Sapphire Crown"
        productUrl="/products/sapphire-crown"
        label="Ask Our Concierge"
      />
    )

    expect(screen.getByText("Ask Our Concierge")).toBeInTheDocument()
  })

  it("opens wa.me URL with pre-filled message upon click", () => {
    render(<WhatsappButton productName="Sapphire Crown" productUrl="/products/sapphire-crown" />)

    const btn = screen.getByRole("button")
    fireEvent.click(btn)

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining("https://wa.me/233242186590?text="),
      "_blank",
      "noopener,noreferrer"
    )
  })

  it("triggers on Enter keydown", () => {
    render(<WhatsappButton productName="Sapphire Crown" productUrl="/products/sapphire-crown" />)

    const btn = screen.getByRole("button")
    fireEvent.keyDown(btn, { key: "Enter", code: "Enter" })

    expect(window.open).toHaveBeenCalledTimes(1)
  })
})
