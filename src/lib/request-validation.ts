export class InputError extends Error {}
export function text(value: unknown, label: string, max = 200, optional = false): string {
  if ((value === undefined || value === null || value === "") && optional) return ""
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) throw new InputError(`Please check ${label}.`)
  return value.trim()
}
export function email(value: unknown): string {
  const result = text(value, "your email address", 254)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) throw new InputError("Please enter a valid email address.")
  return result
}
export function quoteItems(value: unknown): { slug: string; quantity: number }[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 50) throw new InputError("Please select between 1 and 50 items.")
  const seen = new Set<string>()
  return value.map(item => {
    if (!item || typeof item !== "object") throw new InputError("Please check the items in your request.")
    const slug = text(item.slug, "the product reference", 160)
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100 || seen.has(slug)) throw new InputError("Please use a quantity from 1 to 100 for each product, without duplicate products.")
    seen.add(slug)
    return { slug, quantity: item.quantity }
  })
}
