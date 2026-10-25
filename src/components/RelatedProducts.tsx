import { prisma } from "@/lib/db"
import ProductRail from "./ProductRail"
export default async function RelatedProducts({ slug, category }: { slug: string; category: string }) {
  let products
  try {
    products = await prisma.product.findMany({ where: { slug: { not: slug }, category: { slug: category } }, take: 4, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { id: true, slug: true, name: true, images: { orderBy: { sortOrder: "asc" }, take: 2, select: { url: true, alt: true } } } })
  } catch { return null }
  return <ProductRail title="You may also like" subtitle="More pieces from this collection." products={products} />
}
