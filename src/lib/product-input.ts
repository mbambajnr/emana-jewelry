import { RequestError } from "./request-safety"
interface ImageInput { url: string; alt: string; metal?: unknown }
interface MaterialInput { metal: string; purity: string; weight?: string }
interface StoneInput { type: string; carat: string; clarity?: string; color?: string; cut?: string; certification?: string }
interface ProductInput {
  slug?: string; name?: string; description?: string; sku?: string; categoryId?: string; subcategory?: string | null; youtubeUrl?: string | null
  available?: boolean; metalOptions?: unknown; availabilityStatus?: unknown; sizeNotes?: unknown; deliveryNotes?: unknown; careInstructions?: unknown; version?: number
  images?: ImageInput[]; details?: { text: string }[]; materials?: MaterialInput[]; stones?: StoneInput[]
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new RequestError("Please check the product details.")
  return value as Record<string, unknown>
}
function text(value: unknown, max: number, required = true) {
  if (!required && (value == null || value === "")) return ""
  if (typeof value !== "string" || value.length > max || (required && !value.trim())) throw new RequestError(`Check the product text fields and their length limits (up to ${max} characters).`)
  return value
}
function array<T>(value: unknown, max: number, read: (item: Record<string, unknown>) => T): T[] | undefined {
  if (value === undefined) return undefined
  if (!Array.isArray(value) || value.length > max) throw new RequestError(`Use no more than ${max} items in this product section.`)
  return value.map(item => read(object(item)))
}
export function productInput(value: unknown, create = false): ProductInput {
  const body = object(value), result: ProductInput = {}
  for (const [key, max] of [["name", 300], ["slug", 160], ["description", 10000], ["sku", 191], ["categoryId", 191]] as const) {
    if (body[key] !== undefined || create) result[key] = text(body[key], max)
  }
  if (body.subcategory !== undefined) result.subcategory = text(body.subcategory, 191, false) || null
  if (body.youtubeUrl !== undefined) result.youtubeUrl = text(body.youtubeUrl, 2048, false) || null
  if (body.available !== undefined) { if (typeof body.available !== "boolean") throw new RequestError("Choose a valid availability value."); result.available = body.available }
  if (body.version !== undefined) { if (!Number.isSafeInteger(body.version) || Number(body.version) < 0) throw new RequestError("Please reload the product before saving."); result.version = Number(body.version) }
  for (const key of ["metalOptions", "availabilityStatus", "sizeNotes", "deliveryNotes", "careInstructions"] as const) if (body[key] !== undefined) result[key] = body[key]
  result.images = array(body.images, 40, item => {
    const url = text(item.url, 2048)
    const local = url.startsWith("/") && !url.startsWith("//") && !url.includes("..") && !url.includes("\\")
    let remote = false
    try { const parsed = new URL(url); remote = parsed.protocol === "https:" && !parsed.username && !parsed.password } catch {}
    if (!local && !remote) throw new RequestError("Use an uploaded photo or a valid HTTPS photo URL.")
    return { url, alt: text(item.alt, 500, false), metal: item.metal }
  })
  result.details = array(body.details, 30, item => ({ text: text(item.text, 2000) }))
  result.materials = array(body.materials, 10, item => ({ metal: text(item.metal, 191), purity: text(item.purity, 191), weight: text(item.weight, 191, false) }))
  result.stones = array(body.stones, 10, item => ({ type: text(item.type, 191), carat: text(item.carat, 191), clarity: text(item.clarity, 191, false), color: text(item.color, 191, false), cut: text(item.cut, 191, false), certification: text(item.certification, 191, false) }))
  return result
}
