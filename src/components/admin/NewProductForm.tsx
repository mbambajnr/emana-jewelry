import Link from "next/link"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/db"
import ProductForm, { type CategoryOption } from "@/app/admin/products/product-form"

export default async function NewProductForm() {
  await requireAdmin()
  let categories: CategoryOption[]
  try {
    categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true },
    })
  } catch {
    // Passing the raw database Error to Next's development logger can itself
    // fail while mapping its stack with the WASM compiler. Render the outage.
    return <section role="alert">
      <h2>We couldn’t load your collections</h2>
      <p>The database is unavailable. Start PostgreSQL and apply the pending migrations, then refresh this page.</p>
      <p>Your existing products haven’t been changed. A working database is needed before a new product can be saved.</p>
      <Link href="/admin">Back to overview</Link>
    </section>
  }
  return <ProductForm categories={categories} />
}
