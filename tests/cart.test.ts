import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  getCart,
  addToCart,
  removeFromCart,
  updateQuantity,
  getCartCount,
  getCartTotal,
  clearCart,
} from "@/lib/cart"

describe("Cart Storage & State Management", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it("returns empty array when cart is empty", () => {
    expect(getCart()).toEqual([])
    expect(getCartCount()).toBe(0)
    expect(getCartTotal()).toBe(0)
  })

  it("adds new items to cart and computes count and total", () => {
    const dispatchSpy = vi.spyOn(window, "dispatchEvent")

    addToCart({
      slug: "emerald-pendant",
      name: "Emerald Pendant",
      image: "/emerald.png",
      price: 2500,
      quantity: 1,
    })

    expect(getCartCount()).toBe(1)
    expect(getCartTotal()).toBe(2500)
    expect(dispatchSpy).toHaveBeenCalled()

    // Add another item
    addToCart({
      slug: "gold-ring",
      name: "Gold Ring",
      image: "/gold.png",
      price: 1500,
      quantity: 2,
    })

    expect(getCartCount()).toBe(3)
    expect(getCartTotal()).toBe(5500)
  })

  it("increments quantity when existing item is added again", () => {
    addToCart({
      slug: "emerald-pendant",
      name: "Emerald Pendant",
      image: "/emerald.png",
      price: 2500,
      quantity: 1,
    })

    addToCart({
      slug: "emerald-pendant",
      name: "Emerald Pendant",
      image: "/emerald.png",
      price: 2500,
      quantity: 3,
    })

    const items = getCart()
    expect(items.length).toBe(1)
    expect(items[0].quantity).toBe(4)
    expect(getCartTotal()).toBe(10000)
  })

  it("updates item quantity directly", () => {
    addToCart({
      slug: "gold-ring",
      name: "Gold Ring",
      image: "/gold.png",
      price: 1000,
      quantity: 1,
    })

    updateQuantity("gold-ring", 5)
    expect(getCartCount()).toBe(5)
    expect(getCartTotal()).toBe(5000)

    // Updating to 0 should remove the item
    updateQuantity("gold-ring", 0)
    expect(getCartCount()).toBe(0)
    expect(getCart().length).toBe(0)
  })

  it("removes item by slug", () => {
    addToCart({ slug: "item-1", name: "Item 1", image: "/1.png", price: 100 })
    addToCart({ slug: "item-2", name: "Item 2", image: "/2.png", price: 200 })

    removeFromCart("item-1")
    const items = getCart()
    expect(items.length).toBe(1)
    expect(items[0].slug).toBe("item-2")
  })

  it("clears the cart", () => {
    addToCart({ slug: "item-1", name: "Item 1", image: "/1.png", price: 100 })
    clearCart()
    expect(getCart()).toEqual([])
    expect(getCartCount()).toBe(0)
  })
})

describe("metal choices in the quote list", () => {
  beforeEach(() => localStorage.clear())
  it("keeps Gold and Silver separate and changes only the selected line", () => {
    const piece = { slug: "pendant", name: "Pendant", image: "/pendant.jpg", price: 0 }
    addToCart({ ...piece, metal: "Gold" })
    addToCart({ ...piece, metal: "Silver", quantity: 2 })
    addToCart({ ...piece, metal: "Gold" })
    expect(getCart()).toHaveLength(2)
    expect(getCart().find(item => item.metal === "Gold")?.quantity).toBe(2)
    updateQuantity("pendant", 4, "Silver")
    expect(getCart().find(item => item.metal === "Gold")?.quantity).toBe(2)
    expect(getCart().find(item => item.metal === "Silver")?.quantity).toBe(4)
    removeFromCart("pendant", "Gold")
    expect(getCart()).toEqual([expect.objectContaining({ metal: "Silver", quantity: 4 })])
  })
  it("preserves older quote items that have no metal choice", () => {
    const piece = { slug: "pendant", name: "Pendant", image: "/pendant.jpg", price: 0 }
    addToCart(piece)
    addToCart({ ...piece, metal: "Silver" })
    removeFromCart("pendant", "Silver")
    expect(getCart()).toEqual([expect.objectContaining({ slug: "pendant", quantity: 1 })])
  })
})
