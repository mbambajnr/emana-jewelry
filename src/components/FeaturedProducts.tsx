import { connection } from "next/server"
import { prisma } from "@/lib/db"
import ProductSnippets from "./ProductSnippets"

export default async function FeaturedProducts() {
  await connection()
  let products
  try {
    products = await prisma.product.findMany({
      take: 24,
      orderBy: { createdAt: "desc" },
      include: { category: true, images: { orderBy: { sortOrder: "asc" } }, materials: true, stones: true },
    })
  } catch {
    return <section id="featured-creations" style={{ padding: "56px 20px", textAlign: "center" }}>
      <h2>Featured Jewelry</h2><p>We couldn’t load our pieces right now. Please refresh or speak with us on WhatsApp.</p>
      <a href="https://wa.me/233242186590" target="_blank" rel="noopener noreferrer">Speak with Emana →</a>
    </section>
  }
  return <ProductSnippets products={products.map(product => ({
    id: product.id, slug: product.slug, name: product.name, description: product.description,
    category: product.category.slug, categoryName: product.category.name, subcategory: product.subcategory,
    images: product.images.map(image => image.url), price: 0,
    materials: product.materials.map(material => ({ metal: material.metal, purity: material.purity })),
    stones: product.stones.map(stone => ({ type: stone.type, carat: stone.carat, certification: stone.certification })),
  }))} />
}
