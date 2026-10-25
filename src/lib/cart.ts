const STORAGE_KEY = "emana_cart"

export interface CartItem {
  slug: string
  name: string
  image: string
  price: number
  quantity: number
}

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
  } catch {
    return []
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  window.dispatchEvent(new Event("cart"))
}

export function addToCart(item: Omit<CartItem, "quantity"> & { quantity?: number }) {
  const items = getCart()
  const existing = items.find((i) => i.slug === item.slug)
  if (existing) {
    existing.quantity += item.quantity ?? 1
  } else {
    items.push({ ...item, quantity: item.quantity ?? 1 })
  }
  saveCart(items)
  return items
}

export function removeFromCart(slug: string) {
  const items = getCart().filter((i) => i.slug !== slug)
  saveCart(items)
  return items
}

export function updateQuantity(slug: string, quantity: number) {
  if (quantity < 1) return removeFromCart(slug)
  const items = getCart()
  const item = items.find((i) => i.slug === slug)
  if (item) {
    item.quantity = quantity
    saveCart(items)
  }
  return items
}

export function getCartCount(): number {
  return getCart().reduce((sum, i) => sum + i.quantity, 0)
}

export function getCartTotal(): number {
  return getCart().reduce((sum, i) => sum + i.price * i.quantity, 0)
}

export function clearCart() {
  localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event("cart"))
}
