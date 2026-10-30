export const AVAILABILITY_OPTIONS = {
  available: "Available",
  made_to_order: "Made to order",
  confirm: "Confirm availability",
} as const

export interface ProductInformation {
  availabilityStatus?: string | null
  sizeNotes?: string | null
  deliveryNotes?: string | null
  careInstructions?: string | null
}

export function availabilityLabel(product: ProductInformation & { available: boolean }) {
  const status = product.availabilityStatus
  return status && Object.hasOwn(AVAILABILITY_OPTIONS, status)
    ? AVAILABILITY_OPTIONS[status as keyof typeof AVAILABILITY_OPTIONS]
    : product.available ? "Available for inquiry" : "Ask about making this piece"
}

// Omitted fields remain unchanged for older clients; empty text clears a field.
export function validateProductInformation(body: { availabilityStatus?: unknown; sizeNotes?: unknown; deliveryNotes?: unknown; careInstructions?: unknown }) {
  const result: ProductInformation & { available?: boolean } = {}
  if (body.availabilityStatus !== undefined) {
    if (typeof body.availabilityStatus !== "string" || !Object.hasOwn(AVAILABILITY_OPTIONS, body.availabilityStatus)) {
      throw new Error("Choose a valid availability option.")
    }
    result.availabilityStatus = body.availabilityStatus
    result.available = body.availabilityStatus === "available"
  }
  for (const [key, label, limit] of [
    ["sizeNotes", "Size information", 500],
    ["deliveryNotes", "Delivery notes", 1000],
    ["careInstructions", "Care instructions", 2000],
  ] as const) {
    const value = body[key]
    if (value === undefined) continue
    if (value === null) { result[key] = null; continue }
    if (typeof value !== "string" || value.trim().length > limit) throw new Error(`${label} must be text of no more than ${limit} characters.`)
    result[key] = value.trim() || null
  }
  return result
}
