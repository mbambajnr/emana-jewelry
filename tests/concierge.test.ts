import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  buildOrderConciergeMessage,
  buildProductInquiryConciergeMessage,
  buildServiceConciergeMessage,
  getWhatsAppConciergeUrl,
  trackConciergeClick,
  CONCIERGE_PHONE,
  CONCIERGE_DISPLAY_PHONE,
} from "@/lib/concierge"

describe("WhatsApp Concierge Library", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("exports correct phone constants", () => {
    expect(CONCIERGE_PHONE).toBe("233242186590")
    expect(CONCIERGE_DISPLAY_PHONE).toBe("+233 24 218 6590")
  })

  describe("buildOrderConciergeMessage", () => {
    it("formats a price request without exposing legacy prices or totals", () => {
      const msg = buildOrderConciergeMessage({
        items: [
          { name: "Royal Gold Pendant", quantity: 1, price: 4500 },
          { name: "Emerald Stud Earrings", quantity: 2, price: 1200 },
        ],
        total: 6900,
      })

      expect(msg).toContain("EMANA JEWELRY — CONCIERGE QUOTE REQUEST")
      expect(msg).toContain("Royal Gold Pendant* × 1")
      expect(msg).toContain("Emerald Stud Earrings* × 2")
      expect(msg).not.toContain("GHS")
      expect(msg).not.toContain("Estimated Total")
    })

    it("includes reference order number when provided", () => {
      const msg = buildOrderConciergeMessage({
        orderId: "cm1234567890abcdef",
        items: [{ name: "Bespoke Diamond Band", quantity: 1, price: 15000 }],
        total: 15000,
      })

      expect(msg).toContain("Reference Order: #CM123456")
    })

    it("includes client contact and delivery notes when provided", () => {
      const msg = buildOrderConciergeMessage({
        customerName: "Kofi Mensah",
        customerPhone: "+233551234567",
        deliveryAddress: "Airport Residential, Accra",
        notes: "Ring size 7, 18k Yellow Gold",
        items: [{ name: "Solitaire Engagement Ring", quantity: 1 }],
      })

      expect(msg).toContain("• Name: Kofi Mensah")
      expect(msg).toContain("• Phone: +233551234567")
      expect(msg).toContain("• Delivery Address: Airport Residential, Accra")
      expect(msg).toContain("• Special Instructions: Ring size 7, 18k Yellow Gold")
    })
  })

  describe("buildProductInquiryConciergeMessage", () => {
    it("formats a product inquiry with link", () => {
      const msg = buildProductInquiryConciergeMessage(
        "Kente Gold Cuff Bracelet",
        "https://emanajewelry.com/products/kente-gold-cuff"
      )

      expect(msg).toContain("Hello Emana, I’m interested")
      expect(msg).toContain("*Kente Gold Cuff Bracelet*")
      expect(msg).toContain("https://emanajewelry.com/products/kente-gold-cuff")
    })
  })

  describe("buildServiceConciergeMessage", () => {
    it("formats a service appointment booking inquiry", () => {
      const msg = buildServiceConciergeMessage("Ultrasonic Deep Cleaning & Polishing", "2026-11-05")

      expect(msg).toContain("EMANA JEWELRY — APPOINTMENT REQUEST")
      expect(msg).toContain("*Ultrasonic Deep Cleaning & Polishing*")
      expect(msg).toContain("Preferred Date: 2026-11-05")
    })
  })

  describe("getWhatsAppConciergeUrl", () => {
    it("generates a valid wa.me URL with encoded message parameter", () => {
      const url = getWhatsAppConciergeUrl("Hello & Welcome to Emana!")
      expect(url.startsWith("https://wa.me/233242186590?text=")).toBe(true)
      expect(url).toContain(encodeURIComponent("Hello & Welcome to Emana!"))
    })
  })

  describe("trackConciergeClick", () => {
    it("fires fetch to the analytics endpoint", () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({ ok: true })))
      )

      trackConciergeClick("/cart", "cart_checkout_click", "Gold Ring")

      expect(fetchSpy).toHaveBeenCalledWith("/api/analytics/whatsapp-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          source: "/cart",
          label: "cart_checkout_click",
          product: "Gold Ring",
        }),
      })
    })
  })
})
