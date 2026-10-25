import { describe, it, expect } from "vitest"

interface OrderInput {
  name?: string
  email?: string
  phone?: string
  address?: string
  items?: Array<{ slug?: string; name?: string; image?: string; price?: number; quantity?: number }>
}

function validateAndNormalizeOrder(input: OrderInput) {
  const { name, email, phone, address, items } = input
  if (!name || !email || !phone || !address || !items?.length) {
    return { valid: false, error: "Missing required fields" }
  }

  const cleanItems = items.map((i) => ({
    slug: String(i.slug ?? ""),
    name: String(i.name ?? ""),
    image: String(i.image ?? ""),
    price: Number(i.price) || 0,
    quantity: Number(i.quantity) || 1,
  }))

  const cleanTotal = cleanItems.reduce((s, i) => s + i.price * i.quantity, 0)

  return {
    valid: true,
    cleanItems,
    cleanTotal,
  }
}

describe("Order Normalization & Business Rules", () => {
  it("rejects orders with missing required fields", () => {
    expect(validateAndNormalizeOrder({ name: "Kofi" })).toEqual({
      valid: false,
      error: "Missing required fields",
    })

    expect(
      validateAndNormalizeOrder({
        name: "Kofi",
        email: "kofi@example.com",
        phone: "+233555",
        address: "Accra",
        items: [],
      })
    ).toEqual({
      valid: false,
      error: "Missing required fields",
    })
  })

  it("cleans items and calculates subtotal correctly", () => {
    const result = validateAndNormalizeOrder({
      name: "Akosua",
      email: "akosua@example.com",
      phone: "+233244123456",
      address: "Ridge, Accra",
      items: [
        { slug: "gold-bracelet", name: "18k Gold Bracelet", image: "/img.jpg", price: 2500, quantity: 2 },
        { slug: "emerald-ring", name: "Emerald Ring", image: "/ring.jpg", price: 5000, quantity: 1 },
      ],
    })

    expect(result.valid).toBe(true)
    expect(result.cleanTotal).toBe(10000)
    expect(result.cleanItems?.length).toBe(2)
  })

  it("defaults quantity to 1 and handles missing prices safely", () => {
    const result = validateAndNormalizeOrder({
      name: "Kwame",
      email: "kwame@example.com",
      phone: "+233201234567",
      address: "Takoradi",
      items: [{ slug: "custom-pendant", name: "Custom Pendant" }],
    })

    expect(result.valid).toBe(true)
    expect(result.cleanItems?.[0].quantity).toBe(1)
    expect(result.cleanItems?.[0].price).toBe(0)
    expect(result.cleanTotal).toBe(0)
  })
})
