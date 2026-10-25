export interface WishlistItem {
  slug: string
  name: string
  image: string
  price?: number
  subcategory: string | null
}

const STORAGE_KEY = "emana_wishlist"

export function getWishlist(): WishlistItem[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
  } catch {
    return []
  }
}

export function addToWishlist(item: WishlistItem) {
  const list = getWishlist()
  if (!list.some((i) => i.slug === item.slug)) {
    list.push(item)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  }
  window.dispatchEvent(new Event("wishlist"))
  return list
}

export function removeFromWishlist(slug: string) {
  const list = getWishlist().filter((i) => i.slug !== slug)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  window.dispatchEvent(new Event("wishlist"))
  return list
}

export function isInWishlist(slug: string): boolean {
  return getWishlist().some((i) => i.slug === slug)
}

export function getWishlistCount(): number {
  return getWishlist().length
}
