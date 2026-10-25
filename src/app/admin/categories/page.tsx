"use client"

import { useState, useEffect } from "react"
import styles from "./categories.module.css"

interface Category {
  id: string
  slug: string
  name: string
  description: string
  image: string
  sortOrder: number
  createdAt: string
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    image: "",
    sortOrder: "0",
  })

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories")
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setCategories(data)
    } catch (err) {
      console.error(err)
      setError("Failed to load categories")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setTimeout(() => {
      fetchCategories()
    }, 0)
  }, [])

  // Auto-generate slug from name if the user hasn't typed a custom slug
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setForm((prev) => ({
      ...prev,
      name: val,
      slug: prev.slug === "" || prev.slug === prev.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
        ? val.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
        : prev.slug,
    }))
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)
    setUploading(true)
    setError("")

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      })
      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json()
      setForm((prev) => ({ ...prev, image: data.url }))
    } catch {
      setError("Failed to upload image")
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          sortOrder: Number(form.sortOrder) || 0,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to create category")
      }

      setForm({
        name: "",
        slug: "",
        description: "",
        image: "",
        sortOrder: "0",
      })

      fetchCategories()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Categories</h1>
      </div>

      <div className={styles.container}>
        {/* Left Form Column */}
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Create New Category</h2>
          <form className={styles.form} onSubmit={handleSubmit}>
            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.field}>
              <label className={styles.label}>Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={handleNameChange}
                placeholder="e.g. Diamond Rings"
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Slug</label>
              <input
                type="text"
                required
                value={form.slug}
                onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="e.g. diamond-rings"
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Description</label>
              <textarea
                required
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Short description of this collection..."
                className={styles.textarea}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Category Image</label>
              <input
                type="text"
                required
                value={form.image}
                onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))}
                placeholder="Image URL or upload below"
                className={styles.input}
              />
              <div className={styles.uploadRow}>
                <label className={styles.fileInputLabel}>
                  Upload File
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    style={{ display: "none" }}
                  />
                </label>
                {uploading && <span className={styles.uploading}>Uploading...</span>}
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Sort Order</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: e.target.value }))}
                placeholder="0"
                className={styles.input}
              />
            </div>

            <button type="submit" disabled={submitting || uploading} className={styles.submitBtn}>
              {submitting ? "Creating..." : "Create Category"}
            </button>
          </form>
        </div>

        {/* Right List Column */}
        <div className={styles.listSection}>
          <h2 className={styles.sectionTitle}>Existing Categories</h2>
          {loading ? (
            <p>Loading categories...</p>
          ) : categories.length === 0 ? (
            <p>No categories found.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Sort Order</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td>
                      <div className={styles.thumb}>
                        {cat.image ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={cat.image} alt={cat.name} className={styles.thumbImg} />
                        ) : (
                          <div style={{ padding: 6, fontSize: 10, color: "var(--text-muted)" }}>No img</div>
                        )}
                      </div>
                    </td>
                    <td className={styles.nameCell}>{cat.name}</td>
                    <td className={styles.mono}>{cat.slug}</td>
                    <td className={styles.mono}>{cat.sortOrder}</td>
                    <td className={styles.descCell} title={cat.description}>{cat.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
