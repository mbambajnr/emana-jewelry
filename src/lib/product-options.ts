export const METAL_OPTIONS = ["Gold", "Silver"] as const
export type MetalOption = (typeof METAL_OPTIONS)[number]

export function isMetalOption(value: unknown): value is MetalOption {
  return value === "Gold" || value === "Silver"
}

export function productMetalOptions(value?: unknown): MetalOption[] {
  return value === undefined ? [...METAL_OPTIONS] : Array.isArray(value) ? METAL_OPTIONS.filter(option => value.includes(option)) : []
}

export function validateMetalOptions(value: unknown): MetalOption[] {
  if (value === undefined) return [...METAL_OPTIONS]
  if (!Array.isArray(value) || value.length === 0 || value.length > 2 || value.some(option => !isMetalOption(option)) || new Set(value).size !== value.length) {
    throw new Error("Choose Gold, Silver, or both for this product.")
  }
  return productMetalOptions(value)
}

export function photoMetal(value: unknown): MetalOption | null {
  if (value === undefined || value === null || value === "") return null
  if (!isMetalOption(value)) throw new Error("Photo metal must be Gold, Silver, or General.")
  return value
}

export function photosForMetal<T extends { url: string; metal?: string | null; sortOrder: number }>(images: readonly T[], metal?: MetalOption): T[] {
  return images.filter(image => image.url && (!metal || !image.metal || image.metal === metal))
    .sort((a, b) => (metal ? Number(b.metal === metal) - Number(a.metal === metal) : 0) || a.sortOrder - b.sortOrder)
}
