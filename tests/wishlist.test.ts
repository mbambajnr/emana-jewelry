import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  isInWishlist,
  getWishlistCount,
} from "@/lib/wishlist"

describe("Wishlist Storage & State Management", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it("returns empty array initially", () => {
    expect(getWishlist()).toEqual([])
    expect(getWishlistCount()).toBe(0)
    expect(isInWishlist("any-slug")).toBe(false)
  })

  it("adds items and checks existence", () => {
    const dispatchSpy = vi.spyOn(window, "dispatchEvent")

    addToWishlist({
      slug: "solitaire-ring",
      name: "Solitaire Diamond Ring",
      image: "/ring.png",
      price: 12000,
      subcategory: "Rings",
    })

    expect(getWishlistCount()).toBe(1)
    expect(isInWishlist("solitaire-ring")).toBe(true)
    expect(dispatchSpy).toHaveBeenCalled()

    // Adding duplicate should not duplicate item
    addToWishlist({
      slug: "solitaire-ring",
      name: "Solitaire Diamond Ring",
      image: "/ring.png",
      price: 12000,
      subcategory: "Rings",
    })
    expect(getWishlistCount()).toBe(1)
  })

  it("removes item from wishlist", () => {
    addToWishlist({
      slug: "gold-chain",
      name: "Gold Chain",
      image: "/chain.png",
      price: 3000,
      subcategory: "Necklaces",
    })

    expect(isInWishlist("gold-chain")).toBe(true)
    removeFromWishlist("gold-chain")
    expect(isInWishlist("gold-chain")).toBe(false)
    expect(getWishlistCount()).toBe(0)
  })
})
