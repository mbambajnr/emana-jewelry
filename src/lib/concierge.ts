import { absoluteUrl } from "./seo"

export const CONCIERGE_PHONE = "233242186590"
export const CONCIERGE_DISPLAY_PHONE = "+233 24 218 6590"
export const CONCIERGE_EMAIL = "emanagold6590@gmail.com"
export const CONCIERGE_HOURS = "Monday – Saturday: 9:00 AM – 6:00 PM GMT"

export interface ConciergeItem {
  name: string
  quantity: number
  price?: number
  slug?: string
}

export interface ConciergeOrderDetails {
  orderId?: string
  customerName?: string
  customerPhone?: string
  deliveryAddress?: string
  notes?: string
  items: ConciergeItem[]
  total?: number
}

/**
 * Builds an elegant, structured WhatsApp message for requesting an order quote or reserving items.
 */
export function buildOrderConciergeMessage(details: ConciergeOrderDetails): string {
  const parts: string[] = [
    "*EMANA JEWELRY — CONCIERGE QUOTE REQUEST*",
  ]

  if (details.orderId) {
    parts.push(`Reference Order: #${details.orderId.slice(0, 8).toUpperCase()}`)
  }

  parts.push("")
  parts.push("Hello Emana, please let me know the price and availability of these pieces:")

  details.items.forEach((item, index) => {
    parts.push(`${index + 1}. *${item.name}* × ${item.quantity}`)
  })

  if (details.customerName || details.deliveryAddress || details.notes) {
    parts.push("")
    parts.push("*Client Details:*")
    if (details.customerName) parts.push(`• Name: ${details.customerName}`)
    if (details.customerPhone) parts.push(`• Phone: ${details.customerPhone}`)
    if (details.deliveryAddress) parts.push(`• Delivery Address: ${details.deliveryAddress}`)
    if (details.notes) parts.push(`• Special Instructions: ${details.notes}`)
  }

  parts.push("")
  parts.push("Please let me know what’s available, the sizes, and how I can pay and arrange delivery. I’d also like to know about the certificates.")
  parts.push("Thank you!")

  return parts.join("\n")
}

/**
 * Builds an inquiry message for a specific catalog item.
 */
export function buildProductInquiryConciergeMessage(
  productName: string,
  productUrl?: string,
): string {
  const parts = [
    `Hello Emana, I’m interested in the *${productName}*.`,
    "Please, how much is it?",
  ]
  if (productUrl) {
    let url = productUrl
    try {
      const parsed = new URL(productUrl, absoluteUrl("/"))
      const local = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" || parsed.hostname === "[::1]" || /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(parsed.hostname)
      url = local ? absoluteUrl(parsed.pathname) : parsed.toString()
    } catch { url = absoluteUrl("/collections") }
    parts.push("", url)
  }
  return parts.join("\n")
}

/**
 * Builds an inquiry message for care, restoration, or custom bespoke design services.
 */
export function buildServiceConciergeMessage(
  serviceName: string,
  preferredDate?: string
): string {
  const parts: string[] = [
    "*EMANA JEWELRY — APPOINTMENT REQUEST*",
    `Hello Emana, I’d like to book a visit for: *${serviceName}*.`,
  ]

  if (preferredDate) {
    parts.push(`Preferred Date: ${preferredDate}`)
  }

  parts.push("")
  parts.push("Please let me know a suitable time to visit or speak with you online.")
  parts.push("Thank you!")

  return parts.join("\n")
}

/**
 * Returns the full WhatsApp Click-to-Chat deep link for the Emana Concierge.
 */
export function getWhatsAppConciergeUrl(message: string): string {
  return `https://wa.me/${CONCIERGE_PHONE}?text=${encodeURIComponent(message)}`
}

/**
 * Dispatches an analytics event for Chat With Us on WhatsApp interactions.
 */
export function trackConciergeClick(source: string, label?: string, product?: string): void {
  if (typeof window === "undefined") return
  fetch("/api/analytics/whatsapp-click", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source, label, product }),
  }).catch(() => {})
}
