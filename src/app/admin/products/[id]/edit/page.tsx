import { requireAdmin } from "@/lib/auth"
import { Suspense } from "react"
import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import { staticProducts, collections as staticCollections } from "@/lib/products"
import ProductForm, { type ProductData, type CategoryOption } from "../../product-form"
import styles from "../../product-form.module.css"

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <div>
      <h1 className={styles.pageTitle}>Edit Product</h1>
      <Suspense fallback={<p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Loading product details...</p>}>
        <EditFormWrapper params={params} />
      </Suspense>
    </div>
  )
}

async function EditFormWrapper({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params

  let product: ProductData | null = null
  let categories: CategoryOption[] = staticCollections.map((c) => ({
    id: c.slug,
    name: c.name,
    slug: c.slug,
  }))

  try {
    const [dbProduct, dbCategories] = await Promise.all([
      prisma.product.findUnique({
        where: { id },
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          materials: true,
          stones: true,
          details: { orderBy: { sortOrder: "asc" } },
          reviews: true,
        },
      }),
      prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    ])
    if (dbProduct) product = dbProduct
    if (dbCategories && dbCategories.length > 0) categories = dbCategories
  } catch {
    return <section role="alert"><h2>We couldn’t load this product</h2><p>The database is unavailable. Start PostgreSQL and apply the pending migrations, then refresh. Your product has not been changed.</p></section>
  }

  if (!product) {
    const staticProd = staticProducts.find((p) => p.id === id || p.slug === id)
    if (staticProd) {
      product = {
        id: staticProd.id, name: staticProd.name, slug: staticProd.slug,
        youtubeUrl: staticProd.youtubeUrl ?? null,
        description: staticProd.description, price: staticProd.price,
        sku: staticProd.sku, available: staticProd.available,
        subcategory: staticProd.subcategory, originalPrice: staticProd.originalPrice,
        categoryId: staticProd.category,
        materials: staticProd.materials, images: staticProd.images.map(url => ({ url })),
        details: staticProd.details.map(text => ({ text })), stones: staticProd.stones,
      }
    }
  }

  if (!product) notFound()

  return <ProductForm product={product} categories={categories} />
}
