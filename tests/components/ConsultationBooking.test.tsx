import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import ConsultationBooking from "@/components/ConsultationBooking"

describe("ConsultationBooking Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(window, "open").mockImplementation(() => null)
  })

  it("renders booking form fields and submit button", () => {
    render(<ConsultationBooking />)

    expect(screen.getByPlaceholderText(/Your full name/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Request an Appointment/i })).toBeInTheDocument()
  })

  it("validates required name and email fields before submission", async () => {
    render(<ConsultationBooking />)

    const submitBtn = screen.getByRole("button", { name: /Request an Appointment/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText(/Full name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/Email is required/i)).toBeInTheDocument()
    })
  })

  it("validates email formatting", async () => {
    render(<ConsultationBooking />)

    const nameInput = screen.getByPlaceholderText(/Your full name/i)
    const emailInput = screen.getByPlaceholderText(/you@example.com/i)
    const submitBtn = screen.getByRole("button", { name: /Request an Appointment/i })

    const form = submitBtn.closest("form")!
    fireEvent.change(nameInput, { target: { value: "Ama Serwaa" } })
    fireEvent.change(emailInput, { target: { value: "not-an-email" } })
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText(/Invalid email address/i)).toBeInTheDocument()
    })
  })

  it("renders the direct WhatsApp Concierge booking banner", () => {
    render(<ConsultationBooking />)

    expect(
      screen.getByText(/Book directly via WhatsApp/i)
    ).toBeInTheDocument()
  })
})

describe("Custom jewelry form shortcut", () => {
  it("selects custom design when the shortcut is followed, preserving client details", async () => {
    render(<ConsultationBooking />)
    fireEvent.change(screen.getByLabelText("Full Name"), { target: { value: "Ama" } })
    fireEvent.change(screen.getByLabelText("What Can We Help You With?"), { target: { value: "Resizing & Repair Assessment (45 Mins)" } })
    window.history.replaceState({}, "", "/#custom-jewelry-form")
    fireEvent(window, new HashChangeEvent("hashchange"))
    await waitFor(() => expect(screen.getByLabelText("What Can We Help You With?")).toHaveValue("Bespoke Design Walkthrough (30 Mins)"))
    expect(screen.getByLabelText("Full Name")).toHaveValue("Ama")
    expect(document.getElementById("custom-jewelry-form")).toBeInTheDocument()
    window.history.replaceState({}, "", "/")
  })
})
