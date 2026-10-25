import { Suspense } from "react"
import NewProductForm from "@/components/admin/NewProductForm"
import styles from "../product-form.module.css"

export default function NewProductPage() {
  return (
    <div>
      <h1 className={styles.pageTitle}>Add Product</h1>
      <Suspense fallback={<p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Loading categories...</p>}>
        <NewProductForm />
      </Suspense>
    </div>
  )
}

