import { requireAdmin } from "@/lib/auth"
import Link from "next/link"
import { Suspense } from "react"
import { prisma } from "@/lib/db"
import { staticProducts } from "@/lib/products"
import styles from "./products.module.css"

export default function AdminProducts() {
  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Products</h1>
        <Link href="/admin/products/new" className={styles.addBtn}>
          Add Product
        </Link>
      </div>

      <Suspense fallback={<p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Loading products...</p>}>
        <ProductList />
      </Suspense>
    </div>
  )
}

async function ProductList() {
  await requireAdmin()
  let products: Array<{
    id: string
    name: string
    price: number
    sku: string | null
    available: boolean
    category: { name: string }
    images: Array<{ url: string }>
  }> = staticProducts.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    sku: `EMA-${p.slug.toUpperCase().slice(0, 6)}`,
    available: p.available,
    category: { name: p.category },
    images: p.images.map(url => ({ url })),
  }))

  try {
    const dbProducts = await prisma.product.findMany({
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        category: true,
      },
      orderBy: { createdAt: "desc" },
    })
    if (dbProducts && dbProducts.length > 0) {
      products = dbProducts
    }
  } catch {
    return <p role="alert">We couldn’t load this information. Check the database connection and migrations, then refresh. No records have been changed.</p>
  }

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Image</th>
          <th>Name</th>
          <th>Category</th>
          <th>Pricing</th>
          <th>SKU</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {products.map((p) => (
          <tr key={p.id}>
            <td>
              <div className={styles.thumb}>
                {p.images[0] && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={p.images[0].url} alt="" className={styles.thumbImg} />
                )}
              </div>
            </td>
            <td className={styles.nameCell}>{p.name}</td>
            <td>{p.category.name}</td>
            <td>Price on request</td>
            <td className={styles.mono}>{p.sku}</td>
            <td>
              <span className={p.available ? styles.inStock : styles.outOfStock}>
                {p.available ? "Active" : "Inactive"}
              </span>
            </td>
            <td>
              <Link href={`/admin/products/${p.id}/edit`} className={styles.editBtn}>
                Edit
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
