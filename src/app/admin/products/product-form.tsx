"use client"

import { AVAILABILITY_OPTIONS, type ProductInformation } from "@/lib/product-information"

import { METAL_OPTIONS, productMetalOptions, type MetalOption } from "@/lib/product-options"

import { normalizeYoutubeUrl } from "@/lib/product-media"
import { useState, useRef, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import styles from "./product-form.module.css"

export interface CategoryOption {
  id: string
  slug: string
  name: string
}

export interface ProductData extends ProductInformation {
  id?: string
  name?: string
  slug?: string
  subcategory?: string | null
  metalOptions?: unknown
  price?: number
  originalPrice?: number | null
  description?: string
  sku?: string
  available?: boolean
  categoryId?: string
  details?: { text: string }[]
  youtubeUrl?: string | null
  images?: { url: string; alt?: string | null; metal?: string | null }[]
  materials?: { metal: string; purity: string; weight?: string | null }[]
  stones?: {
    type: string
    carat: string
    clarity?: string | null
    color?: string | null
    cut?: string | null
    certification?: string | null
  }[]
}

export default function ProductForm({
  product,
  categories,
}: {
  product?: ProductData
  categories: CategoryOption[]
}) {
  const router = useRouter()
  const isEdit = !!product?.id
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [uploading, setUploading] = useState(false)
  const [imageErrors, setImageErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [categoryOptions, setCategoryOptions] = useState(categories)
  const [showNewCollection, setShowNewCollection] = useState(categories.length === 0)
  const [collectionName, setCollectionName] = useState("")
  const [creatingCollection, setCreatingCollection] = useState(false)
  const [collectionError, setCollectionError] = useState("")
  const [collectionMessage, setCollectionMessage] = useState("")

  const [form, setForm] = useState({
    youtubeUrl: product?.youtubeUrl ?? "",
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    subcategory: product?.subcategory ?? "",
    description: product?.description ?? "",
    sku: product?.sku ?? "",
    availabilityStatus: product?.availabilityStatus ?? (product ? (product.available === false ? "made_to_order" : "available") : "confirm"),
    sizeNotes: product?.sizeNotes ?? "",
    deliveryNotes: product?.deliveryNotes ?? "",
    careInstructions: product?.careInstructions ?? "",
    categoryId: product?.categoryId ?? categories[0]?.id ?? "",
  })

  const [metalOptions, setMetalOptions] = useState<MetalOption[]>(productMetalOptions(product?.metalOptions))

  const [details, setDetails] = useState<string[]>(
    product?.details?.map((d) => d.text) ?? [""],
  )
  const [images, setImages] = useState<string[]>(
    product?.images?.map((i) => i.url) ?? [""],
  )
  const [imageAlts, setImageAlts] = useState<string[]>(product?.images?.map(image => image.alt || "") || [])
  const [imageMetals, setImageMetals] = useState<string[]>(product?.images?.map(image => image.metal || "") || [])
  const dragIndex = useRef<number | null>(null)
  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= images.length || from === to) return
    const nextImages = [...images], nextAlts = images.map((_, index) => imageAlts[index] || ""), nextMetals = images.map((_, index) => imageMetals[index] || "")
    nextImages.splice(to, 0, nextImages.splice(from, 1)[0])
    nextAlts.splice(to, 0, nextAlts.splice(from, 1)[0])
    nextMetals.splice(to, 0, nextMetals.splice(from, 1)[0])
    setImages(nextImages); setImageAlts(nextAlts); setImageMetals(nextMetals)
  }
  const [materials, setMaterials] = useState<
    { metal: string; purity: string; weight: string }[]
  >(
    product?.materials?.map((m) => ({
      metal: m.metal,
      purity: m.purity,
      weight: m.weight ?? "",
    })) ?? [{ metal: "", purity: "", weight: "" }],
  )
  const [stones, setStones] = useState<
    {
      type: string
      carat: string
      clarity: string
      color: string
      cut: string
      certification: string
    }[]
  >(
    product?.stones?.map((s) => ({
      type: s.type,
      carat: s.carat,
      clarity: s.clarity ?? "",
      color: s.color ?? "",
      cut: s.cut ?? "",
      certification: s.certification ?? "",
    })) ?? [],
  )

  const update = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const addArrayItem = <T,>(
    setter: (fn: (prev: T[]) => T[]) => void,
    empty: T,
  ) => setter((prev) => [...prev, empty])

  const removeArrayItem = <T,>(
    setter: (fn: (prev: T[]) => T[]) => void,
    index: number,
  ) => setter((prev) => prev.filter((_, i) => i !== index))

  const handleUpload = async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "The photo could not be uploaded.")
      const { url } = data
      if (typeof url !== "string" || !url) throw new Error("The upload did not return a photo. Please try again.")
      setImages((prev) => {
        const next = [...prev]
        const emptyIndex = next.findIndex((u) => !u.trim())
        if (emptyIndex !== -1) next[emptyIndex] = url
        else next.push(url)
        return next
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to upload image")
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleUploads = async (files: File[]) => {
    setError("")
    setUploading(true)
    for (const file of files) await handleUpload(file)
    setUploading(false)
  }

  const createCollection = async () => {
    if (!collectionName.trim()) { setCollectionError("Enter a collection name, such as Rings or Necklaces."); return }
    setCreatingCollection(true); setCollectionError(""); setCollectionMessage("")
    try {
      const response = await fetch("/api/admin/collections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: collectionName.trim() }) })
      const collection = await response.json()
      if (!response.ok) throw new Error(collection.error)
      setCategoryOptions(previous => [...previous, collection])
      update("categoryId", collection.id)
      setCollectionName(""); setShowNewCollection(false)
      setCollectionMessage(`${collection.name} created and selected. Your product details are still here.`)
    } catch (error) { setCollectionError(error instanceof Error ? error.message : "Could not create the collection. Please try again.") }
    finally { setCreatingCollection(false) }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.categoryId) { setError("Choose a collection or create one below before saving."); return }
    if (metalOptions.length === 0) { setError("Choose Gold, Silver, or both for this product."); return }
    setSaving(true)
    setError("")

    const body = {
      ...form,
      metalOptions,
      details: details.filter((d) => d.trim()).map((text) => ({ text })),
      images: images.map((url, index) => ({ url, alt: imageAlts[index] || "", metal: imageMetals[index] || null })).filter(image => image.url.trim()),
      materials: materials.filter((m) => m.metal && m.purity),
      stones: stones.filter((s) => s.type && s.carat),
    }

    try {
      body.youtubeUrl = normalizeYoutubeUrl(form.youtubeUrl) || ""
      const url = isEdit
        ? `/api/admin/products/${product.id}`
        : "/api/admin/products"
      const method = isEdit ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to save")
      }

      router.push("/admin/products")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {error && <div role="alert" className={styles.error}>{error}</div>}

      <fieldset className={styles.metalOptions}>
        <legend>Metal choices for clients</legend>
        <p>Select the options clients can request for this piece.</p>
        <div>{METAL_OPTIONS.map(option => <label key={option}>
          <input type="checkbox" checked={metalOptions.includes(option)} onChange={event => setMetalOptions(previous => event.target.checked ? [...previous, option] : previous.filter(value => value !== option))} />
          {option}
        </label>)}</div>
      </fieldset>

      <div className={styles.grid2}>
        <div className={styles.field}>
          <label className={styles.label}>Name</label>
          <input
            className={styles.input}
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            required
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Slug</label>
          <input
            className={styles.input}
            value={form.slug}
            onChange={(e) => update("slug", e.target.value)}
            required
          />
        </div>
      </div>

      <div className={styles.grid2}>
        <div className={styles.field}>
          <label htmlFor="product-collection" className={styles.label}>Collection</label>
          <select
            className={styles.select}
            id="product-collection"
            disabled={creatingCollection}
            value={form.categoryId}
            onChange={(e) => update("categoryId", e.target.value)}
          >
            <option value="">Choose a collection</option>
            {categoryOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {!showNewCollection && <button type="button" className={styles.addBtn} onClick={() => { setShowNewCollection(true); setCollectionMessage("") }}>+ Create a collection</button>}
          {showNewCollection && <fieldset className={styles.inlineCollection} disabled={creatingCollection}>
            <legend>Create a collection here</legend>
            <label htmlFor="new-collection-name">Collection name</label>
            <input id="new-collection-name" className={styles.input} maxLength={100} value={collectionName} onChange={event => { setCollectionName(event.target.value); setCollectionError("") }} placeholder="For example, Rings or Necklaces" onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); void createCollection() } }} />
            <p className={styles.hint}>We’ll select it for this product. You can add a collection cover and description later under Collections.</p>
            <div className={styles.collectionActions}><button type="button" className={styles.addBtn} onClick={createCollection}>{creatingCollection ? "Creating…" : "Create and select"}</button>{categoryOptions.length > 0 && <button type="button" className={styles.addBtn} onClick={() => { setShowNewCollection(false); setCollectionError("") }}>Cancel</button>}</div>
          </fieldset>}
          {collectionError && <p role="alert" className={styles.error}>{collectionError}</p>}
          {collectionMessage && <p role="status" className={styles.hint}>{collectionMessage}</p>}
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Subcategory</label>
          <input
            className={styles.input}
            value={form.subcategory}
            onChange={(e) => update("subcategory", e.target.value)}
          />
        </div>
      </div>

      <p className={styles.hint}>Prices are provided by the shop owner after a client asks. You don’t need to enter a price to list this product.</p>
      <div className={styles.grid3}>
        <div className={styles.field}>
          <label className={styles.label}>SKU</label>
          <input
            className={styles.input}
            value={form.sku}
            onChange={(e) => update("sku", e.target.value)}
            required
          />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Description</label>
        <textarea
          className={styles.textarea}
          rows={4}
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          required
        />
      </div>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Availability, sizes &amp; care</legend>
        <p className={styles.hint}>These details appear on the product page. Leave optional notes empty to use the usual enquiry guidance. Describe the actual material and finish in Materials below.</p>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="availability-status">Availability</label>
          <select id="availability-status" className={styles.select} value={form.availabilityStatus} onChange={event => update("availabilityStatus", event.target.value)}>
            {Object.entries(AVAILABILITY_OPTIONS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        {([
          ["sizeNotes", "Size information", "For example, chain length or available ring sizes", 500],
          ["deliveryNotes", "Delivery notes", "Collection options and delivery timing for this piece", 1000],
          ["careInstructions", "Care instructions", "How to clean, wear, and store this piece", 2000],
        ] as const).map(([key, label, placeholder, maxLength]) => <div className={styles.field} key={key}>
          <label className={styles.label} htmlFor={key}>{label} (optional)</label>
          <textarea id={key} className={styles.textarea} rows={3} maxLength={maxLength} placeholder={placeholder} value={form[key]} onChange={event => update(key, event.target.value)} />
        </div>)}
      </fieldset>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="youtube-url">Product video (optional)</label>
        <input id="youtube-url" className={styles.input} type="url" value={form.youtubeUrl} onChange={event => update("youtubeUrl", event.target.value)} placeholder="https://www.youtube.com/watch?v=…" />
        <p className={styles.hint}>Paste a YouTube watch, Shorts, or share link. Clients choose when to play it; the video won’t load until they tap play.</p>
      </div>

      {/* Images */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Product photos</legend>
        <p className={styles.hint}>The first photo is your cover image. Drag photos to reorder them, or use the arrow buttons. Add a front view, a close-up, and a photo showing the piece being worn. Label each photo Gold, Silver, or General so the gallery can follow the client’s choice.</p>

        {metalOptions.filter(option => !images.some((url, index) => url.trim() && imageMetals[index] === option)).map(option => <p key={option} className={styles.hint}>{option} photo not assigned yet. Upload a photo of that version and choose {option} under Photo version.</p>)}

        <div className={styles.uploadRow}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            disabled={uploading}
            aria-label="Upload product photos"
            className={styles.fileInput}
            onChange={(e) => {
              const files = Array.from(e.target.files || [])
              if (files.length) handleUploads(files)
            }}
          />
          {uploading && <span className={styles.uploading}>Uploading...</span>}
        </div>

        {images.map((url, i) => (
          <div key={i} className={styles.imageRow} draggable={!uploading} onDragStart={() => { dragIndex.current = i }} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (dragIndex.current !== null) moveImage(dragIndex.current, i); dragIndex.current = null }}>
            <span className={styles.hint}>{i === 0 ? "Cover" : `Photo ${i + 1}`}</span>
            {imageErrors.includes(url) && <p role="alert" className={styles.hint}>This photo couldn’t be displayed. Check its URL or upload it again.</p>}
            {url && !imageErrors.includes(url) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt={`Product photo ${i + 1} preview`}
                className={styles.thumb}
                onError={() => setImageErrors(previous => [...previous, url])}
              />
            )}
            <input
              className={styles.input}
              value={url}
              onChange={(e) =>
                setImages((prev) =>
                  prev.map((v, j) => (j === i ? e.target.value : v)),
                )
              }
              aria-label={`Photo ${i + 1} URL`}
              placeholder="Image URL or upload above"
            />
            <input className={styles.input} aria-label={`Photo ${i + 1} description`} placeholder="Describe this photo, e.g. Side view of the gold ring" value={imageAlts[i] || ""} onChange={event => setImageAlts(images.map((_, index) => index === i ? event.target.value : imageAlts[index] || ""))} />
            <label className={styles.hint}>
              Photo version
              <select className={styles.input} aria-label={`Photo ${i + 1} metal`} value={imageMetals[i] || ""} onChange={event => setImageMetals(images.map((_, index) => index === i ? event.target.value : imageMetals[index] || ""))}>
                <option value="">General photo</option><option value="Gold">Gold</option><option value="Silver">Silver</option>
              </select>
            </label>
            <button type="button" className={styles.mediaOrder} aria-label={`Move photo ${i + 1} earlier`} disabled={i === 0 || uploading} onClick={() => moveImage(i, i - 1)}>↑</button>
            <button type="button" className={styles.mediaOrder} aria-label={`Move photo ${i + 1} later`} disabled={i === images.length - 1 || uploading} onClick={() => moveImage(i, i + 1)}>↓</button>
            {images.length > 1 && (
              <button
                type="button"
                className={styles.removeBtn}
                aria-label={`Remove photo ${i + 1}`}
                onClick={() => { removeArrayItem(setImages, i); setImageAlts(images.map((_, index) => imageAlts[index] || "").filter((_, index) => index !== i)); setImageMetals(images.map((_, index) => imageMetals[index] || "").filter((_, index) => index !== i)) }}
              >
                &times;
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          className={styles.addBtn}
          onClick={() => addArrayItem(setImages, "")}
        >
          + Add Image
        </button>
      </fieldset>

      {/* Details */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Details</legend>
        {details.map((text, i) => (
          <div key={i} className={styles.arrayRow}>
            <input
              className={styles.input}
              value={text}
              onChange={(e) =>
                setDetails((prev) =>
                  prev.map((v, j) => (j === i ? e.target.value : v)),
                )
              }
              placeholder="e.g., 2.01 ct round brilliant diamond"
            />
            {details.length > 1 && (
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => removeArrayItem(setDetails, i)}
              >
                &times;
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          className={styles.addBtn}
          onClick={() => addArrayItem(setDetails, "")}
        >
          + Add Detail
        </button>
      </fieldset>

      {/* Materials */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Materials</legend>
        {materials.map((mat, i) => (
          <div key={i} className={styles.arrayRow}>
            <input
              className={styles.input}
              placeholder="Metal (e.g., 18K Rose Gold)"
              value={mat.metal}
              onChange={(e) =>
                setMaterials((prev) =>
                  prev.map((v, j) => (j === i ? { ...v, metal: e.target.value } : v)),
                )
              }
            />
            <input
              className={styles.input}
              placeholder="Purity"
              value={mat.purity}
              onChange={(e) =>
                setMaterials((prev) =>
                  prev.map((v, j) => (j === i ? { ...v, purity: e.target.value } : v)),
                )
              }
            />
            <input
              className={styles.input}
              placeholder="Weight (optional)"
              value={mat.weight}
              onChange={(e) =>
                setMaterials((prev) =>
                  prev.map((v, j) => (j === i ? { ...v, weight: e.target.value } : v)),
                )
              }
            />
            {materials.length > 1 && (
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => removeArrayItem(setMaterials, i)}
              >
                &times;
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          className={styles.addBtn}
          onClick={() =>
            addArrayItem(setMaterials, {
              metal: "",
              purity: "",
              weight: "",
            })
          }
        >
          + Add Material
        </button>
      </fieldset>

      {/* Stones */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Stones</legend>
        {stones.map((stone, i) => (
          <div key={i} className={styles.stoneRow}>
            <div className={styles.grid2}>
              <input
                className={styles.input}
                placeholder="Type"
                value={stone.type}
                onChange={(e) =>
                  setStones((prev) =>
                    prev.map((v, j) =>
                      j === i ? { ...v, type: e.target.value } : v,
                    ),
                  )
                }
              />
              <input
                className={styles.input}
                placeholder="Carat"
                value={stone.carat}
                onChange={(e) =>
                  setStones((prev) =>
                    prev.map((v, j) =>
                      j === i ? { ...v, carat: e.target.value } : v,
                    ),
                  )
                }
              />
            </div>
            <div className={styles.grid2}>
              <input
                className={styles.input}
                placeholder="Clarity (optional)"
                value={stone.clarity}
                onChange={(e) =>
                  setStones((prev) =>
                    prev.map((v, j) =>
                      j === i ? { ...v, clarity: e.target.value } : v,
                    ),
                  )
                }
              />
              <input
                className={styles.input}
                placeholder="Color (optional)"
                value={stone.color}
                onChange={(e) =>
                  setStones((prev) =>
                    prev.map((v, j) =>
                      j === i ? { ...v, color: e.target.value } : v,
                    ),
                  )
                }
              />
            </div>
            <div className={styles.grid2}>
              <input
                className={styles.input}
                placeholder="Cut (optional)"
                value={stone.cut}
                onChange={(e) =>
                  setStones((prev) =>
                    prev.map((v, j) =>
                      j === i ? { ...v, cut: e.target.value } : v,
                    ),
                  )
                }
              />
              <input
                className={styles.input}
                placeholder="Certification (optional)"
                value={stone.certification}
                onChange={(e) =>
                  setStones((prev) =>
                    prev.map((v, j) =>
                      j === i ? { ...v, certification: e.target.value } : v,
                    ),
                  )
                }
              />
            </div>
            {stones.length > 1 && (
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => removeArrayItem(setStones, i)}
              >
                &times; Remove
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          className={styles.addBtn}
          onClick={() =>
            addArrayItem(setStones, {
              type: "",
              carat: "",
              clarity: "",
              color: "",
              cut: "",
              certification: "",
            })
          }
        >
          + Add Stone
        </button>
      </fieldset>

      <div className={styles.actions}>
        <button type="submit" className={styles.saveBtn} disabled={saving || uploading || creatingCollection}>
          {saving ? "Saving..." : isEdit ? "Update Product" : "Create Product"}
        </button>
      </div>
    </form>
  )
}
