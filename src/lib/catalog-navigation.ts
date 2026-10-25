export const CATALOG_PAGE_SIZE = 8
export type CatalogSearchParams = Record<string, string | string[] | undefined>
export function catalogQuery(params: CatalogSearchParams) {
  const category = typeof params.category === "string" ? params.category.trim() : ""
  const rawPage = typeof params.page === "string" ? params.page : ""
  const page = /^\d+$/.test(rawPage) && Number.isSafeInteger(Number(rawPage)) && Number(rawPage) > 0 ? Number(rawPage) : 1
  const q = typeof params.q === "string" ? params.q.trim().replace(/\s+/g, " ").slice(0, 120) : ""
  return { category, page, q }
}
export function catalogHref(category: string, page = 1, q = "") {
  const params = new URLSearchParams()
  if (q) params.set("q", q)
  if (category) params.set("category", category)
  if (page > 1) params.set("page", String(page))
  return `/catalog${params.size ? `?${params}` : ""}`
}
export function visiblePageNumbers(page: number, pages: number): (number | "gap")[] {
  const numbers = [...new Set([1, pages, page - 1, page, page + 1])].filter(number => number >= 1 && number <= pages).sort((a, b) => a - b)
  const result: (number | "gap")[] = []
  for (const number of numbers) {
    const previous = result[result.length - 1]
    if (typeof previous === "number" && number - previous > 1) result.push("gap")
    result.push(number)
  }
  return result
}
