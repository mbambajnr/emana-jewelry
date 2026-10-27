export const METAL_OPTIONS = ["Gold", "Silver"] as const
export type MetalOption = (typeof METAL_OPTIONS)[number]

export function isMetalOption(value: unknown): value is MetalOption {
  return value === "Gold" || value === "Silver"
}

export function productMetalOptions(value?: readonly string[]): MetalOption[] {
  return value === undefined ? [...METAL_OPTIONS] : METAL_OPTIONS.filter(option => value.includes(option))
}

export function validateMetalOptions(value: unknown): MetalOption[] {
  if (value === undefined) return [...METAL_OPTIONS]
  if (!Array.isArray(value) || value.length === 0 || value.length > 2 || value.some(option => !isMetalOption(option)) || new Set(value).size !== value.length) {
    throw new Error("Choose Gold, Silver, or both for this product.")
  }
  return productMetalOptions(value)
}
