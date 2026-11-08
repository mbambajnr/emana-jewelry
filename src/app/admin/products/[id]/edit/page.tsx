import { requireAdmin } from "@/lib/auth"
import { Suspense } from "react"
import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
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
  let categories: CategoryOption[] = []

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
    categories = dbCategories
  } catch {
    return <section role="alert"><h2>We couldn’t load this product</h2><p>The database is unavailable. Start MySQL and apply the pending migrations, then refresh. Your product has not been changed.</p></section>
  }

  if (!product) notFound()

  return <ProductForm product={product} categories={categories} />
}
