import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import Header from "@/components/Header"

describe("mobile navigation keyboard access", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })))
  })

  afterEach(() => vi.unstubAllGlobals())

  it("keeps focus inside the open menu and returns it to the trigger on Escape", async () => {
    const user = userEvent.setup()
    render(<Header />)
    const trigger = screen.getByRole("button", { name: /^Menu$/ })
    await user.click(trigger)

    const menu = screen.getByRole("dialog", { name: "Navigation" })
    const close = within(menu).getByRole("button", { name: "Close menu" })
    expect(trigger).toHaveAttribute("aria-expanded", "true")
    expect(close).toHaveFocus()
    expect(document.body.style.overflow).toBe("hidden")

    await user.tab({ shift: true })
    expect(within(menu).getByRole("link", { name: "Book a Visit" })).toHaveFocus()
    await user.tab()
    expect(close).toHaveFocus()

    await user.keyboard("{Escape}")
    expect(trigger).toHaveAttribute("aria-expanded", "false")
    expect(trigger).toHaveFocus()
    expect(document.body.style.overflow).not.toBe("hidden")
  })
})
