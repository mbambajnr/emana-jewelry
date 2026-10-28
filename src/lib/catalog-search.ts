import type { MetalOption } from "./product-options"
import type { Prisma } from "@/generated/prisma/client"
export function catalogWhere(category: string, query: string, metal?: MetalOption): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = category ? { category: { slug: category } } : {}
  if (metal) where.metalOptions = { array_contains: metal }
  const words = query.trim().split(/\s+/).filter(Boolean).slice(0, 8)
  if (words.length) where.AND = words.map(word => {
    const match = { contains: word }
    return { OR: [{ name: match }, { description: match }, { subcategory: match }, { category: { name: match } }, { materials: { some: { OR: [{ metal: match }, { purity: match }] } } }, { stones: { some: { type: match } } }] }
  })
  return where
}
