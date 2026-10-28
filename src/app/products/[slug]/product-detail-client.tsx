"use client"

import { availabilityLabel, type ProductInformation } from "@/lib/product-information"

import { photosForMetal, productMetalOptions, type MetalOption } from "@/lib/product-options"
import { recordProductView } from "@/lib/recently-viewed"
import RecentlyViewed from "@/components/RecentlyViewed"
import CatalogReturnLink from "@/components/CatalogReturnLink"
import { useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import ProductGallery from "@/components/ProductGallery"
import Footer from "@/components/Footer"
import { WhatsappButton } from "@/components/WhatsappButton"
import { absoluteUrl, jsonLdString } from "@/lib/seo"
import { addToCart } from "@/lib/cart"
import { addToWishlist, removeFromWishlist, isInWishlist } from "@/lib/wishlist"
import styles from "./page.module.css"

export interface ProductFromDb extends ProductInformation {
  id: string
  youtubeUrl?: string | null
  slug: string
  name: string
  subcategory: string | null
  metalOptions?: string[]
  price: number
  originalPrice: number | null
  description: string
  available: boolean
  sku: string
  rating: number
  reviewCount: number
  category: { slug: string; name: string }
  images: { url: string; alt?: string | null; metal?: string | null; sortOrder: number }[]
  materials: { metal: string; purity: string; weight: string | null }[]
  stones: {
    type: string
    carat: string
    clarity: string | null
    color: string | null
    cut: string | null
    certification: string | null
  }[]
  details: { text: string }[]
  reviews: { id: string; author: string; rating: number; text: string; date: string }[]
}


export default function ProductDetailClient({ product, preview = false, relatedProducts }: { product: ProductFromDb; preview?: boolean; relatedProducts?: ReactNode }) {
  useEffect(() => { if (!preview) recordProductView(product.slug) }, [product.slug, preview])
  const options = productMetalOptions(product.metalOptions)
  const [selectedMetal, setSelectedMetal] = useState<MetalOption | undefined>(options[0])
  const metal = selectedMetal && options.includes(selectedMetal) ? selectedMetal : options[0]
  const [quantity, setQuantity] = useState(1)
  const [wishlisted, setWishlisted] = useState(false)
  const [added, setAdded] = useState(false)
  useEffect(() => {
    const sync = () => setWishlisted(isInWishlist(product.slug))
    const timer = setTimeout(sync, 0)
    window.addEventListener("wishlist", sync)
    return () => { clearTimeout(timer); window.removeEventListener("wishlist", sync) }
  }, [product.slug])

  const save = () => {
    if (preview) { setWishlisted(!wishlisted); return }
    if (wishlisted) removeFromWishlist(product.slug)
    else addToWishlist({ slug: product.slug, name: product.name, image: product.images[0]?.url || "/hero_bg.png", price: product.price, subcategory: product.subcategory })
    setWishlisted(!wishlisted)
  }
  const requestQuote = () => {
    if (preview) { setAdded(true); return }
    addToCart({ slug: product.slug, name: product.name, image: photosForMetal(product.images, metal)[0]?.url || "/hero_bg.png", price: product.price, quantity, metal })
    setAdded(true)
  }
  const schema = {
    "@context": "https://schema.org", "@type": "Product", name: product.name, description: product.description, sku: product.sku,
    category: product.category.name, image: product.images.map(image => absoluteUrl(image.url)), url: absoluteUrl(`/products/${encodeURIComponent(product.slug)}`), brand: { "@type": "Brand", name: "Emana Jewelry" },
    ...(product.reviews.length > 0 && product.reviewCount > 0 && product.rating > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewCount } } : {}),
  }
  const breadcrumb = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Collections", item: absoluteUrl("/collections") },
    { "@type": "ListItem", position: 2, name: product.category.name, item: absoluteUrl(`/collections/${product.category.slug}`) },
    { "@type": "ListItem", position: 3, name: product.name, item: absoluteUrl(`/products/${encodeURIComponent(product.slug)}`) },
  ] }

  return <div className={styles.page}>
    {!preview && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(schema) }} />}
    {!preview && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumb) }} />}
    <main className={styles.container}>
      <CatalogReturnLink />
      <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/collections">Collections</Link><span aria-hidden="true">›</span><Link href={`/collections/${product.category.slug}`}>{product.category.name}</Link><span aria-hidden="true">›</span><span aria-current="page">{product.name}</span></nav>
      <div className={styles.layout}>
        <ProductGallery key={product.id} metal={metal} name={product.name} images={product.images} youtubeUrl={product.youtubeUrl} />
        <section className={styles.info} aria-labelledby="product-title">
          <Link href={`/collections/${product.category.slug}`} className={styles.eyebrow}>EMANA JEWELRY / {product.subcategory || product.category.name}</Link>
          <h1 id="product-title" className={styles.title}>{product.name}</h1>
          {product.reviewCount > 0 && product.rating > 0 ? <a className={styles.ratingLink} href="#customer-reviews"><span aria-hidden="true">★</span> {product.rating.toFixed(1)} <span>· {product.reviewCount} {product.reviewCount === 1 ? "review" : "reviews"}</span></a> : <p className={styles.newPiece}>Have a question about this piece? We’re happy to help.</p>}
          <div className={styles.summary}><span className={styles.summaryLabel}>MADE WITH CARE IN GHANA</span><p>{product.description}</p></div>
          {product.materials.length > 0 && <dl className={styles.keyDetails}>
            <div><dt>Metal</dt><dd>{product.materials.map(material => `${material.purity} ${material.metal}`).join(", ")}</dd></div>
            {product.materials.some(material => material.weight) && <div><dt>Weight</dt><dd>{product.materials.map(material => material.weight).filter(Boolean).join(", ")}</dd></div>}
            {product.stones.length > 0 && <div><dt>Gemstone</dt><dd>{product.stones.map(stone => [stone.type, stone.carat && `${stone.carat} ct`].filter(Boolean).join(" · ")).join(", ")}</dd></div>}
            <div><dt>Reference</dt><dd>{product.sku}</dd></div>
          </dl>}
          {product.details.length > 0 && <div className={styles.about}><h2>About this piece</h2><ul>{product.details.map((detail, index) => <li key={index}>{detail.text}</li>)}</ul></div>}
          <div className={styles.personalNote}><span aria-hidden="true">✧</span><p>Want a different size or a small change?<br /><a href="#request-panel">Tell us what you have in mind.</a></p></div>
        </section>
        <aside id="request-panel" className={styles.buyBox} aria-label="Request a quote">
          <span className={styles.boxEyebrow}>LET’S MAKE IT YOURS</span>
          <h2>Ask us for a price</h2>
          <p className={styles.priceNote}>We’ll confirm the price, your size, and availability before you decide.</p>
          <p className={styles.availability}><span aria-hidden="true">●</span> {availabilityLabel(product)}</p>
          <div className={styles.delivery}><span aria-hidden="true">⌖</span><p><strong>Collection or delivery</strong><br />{product.deliveryNotes || "Pick up in Takoradi, or ask us about delivery to your location."}</p></div>
          {options.length > 0 && <fieldset className={styles.metalOptions} aria-describedby="metal-choice-note">
            <legend>Choose your metal</legend>
            <div>{options.map(option => <label key={option} className={styles.metalOption}>
              <input type="radio" name="product-metal" value={option} checked={metal === option} onChange={() => { setSelectedMetal(option); setAdded(false) }} />
              <span className={option === "Gold" ? styles.goldSwatch : styles.silverSwatch} aria-hidden="true" />{option}
            </label>)}</div>
            <p id="metal-choice-note">We’ll confirm the material, finish, and availability with your quote.</p>
          </fieldset>}
          <label className={styles.quantityLabel} htmlFor="product-quantity">Quantity</label>
          <select id="product-quantity" value={quantity} className={styles.quantity} onChange={event => { setQuantity(Number(event.target.value)); setAdded(false) }}>{Array.from({ length: 10 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}</select>
          <button className={styles.primaryAction} onClick={requestQuote}>{added ? "Added to your quote request ✓" : "Add to Quote Request"}</button>
          {preview ? <button disabled className={styles.whatsappAction}>Ask Us on WhatsApp</button> : <WhatsappButton metal={metal} productName={product.name} productUrl={`/products/${encodeURIComponent(product.slug)}`} className={styles.whatsappAction} iconSize={18} label="Ask Us on WhatsApp" />}
          <p className={styles.noPayment}>No payment is taken on this page.</p>
          {added && <p role="status" className={styles.addedMessage}>{preview ? "Preview only — no item was saved." : "Your piece has been added."} <Link href="/cart">View your request →</Link></p>}
          <button className={styles.saveAction} onClick={save} aria-pressed={wishlisted}>{wishlisted ? "♥ Saved to your wishlist" : "♡ Save for later"}</button>
          <p className={styles.support}>Prefer to speak with us?<br /><a href="tel:+233242186590">+233 24 218 6590</a></p>
        </aside>
      </div>
      <nav className={styles.sectionLinks} aria-label="More about this product"><a href="#product-details">Product details</a><a href="#delivery-and-care">Delivery &amp; care</a><a href="#customer-reviews">Customer reviews</a></nav>
      <div className={styles.lowerGrid}>
        <section id="product-details" className={styles.detailSection}><span className={styles.eyebrow}>THE FINER DETAILS</span><h2>Know your piece</h2><dl className={styles.specifications}>
          <div><dt>Product reference</dt><dd>{product.sku}</dd></div><div><dt>Collection</dt><dd>{product.category.name}</dd></div><div><dt>Metal choices</dt><dd>{options.join(" or ")}</dd></div>
          {product.sizeNotes && <div><dt>Sizes</dt><dd>{product.sizeNotes}</dd></div>}
          {product.materials.map((material, i) => <div key={`metal-${i}`}><dt>{material.metal}</dt><dd>{[material.purity, material.weight].filter(Boolean).join(" · ")}</dd></div>)}
          {product.stones.map((stone, i) => <div key={`stone-${i}`}><dt>{stone.type}</dt><dd>{[stone.carat && `${stone.carat} ct`, stone.color, stone.clarity, stone.cut, stone.certification].filter(Boolean).join(" · ") || "Ask us for details"}</dd></div>)}
        </dl></section>
        <section id="delivery-and-care" className={styles.detailSection}><span className={styles.eyebrow}>BEFORE YOU ORDER</span><h2>A little peace of mind</h2><details open><summary>Collection &amp; delivery</summary><p>{product.deliveryNotes || "Collect from our shop on Justmoh Ave, Takoradi. For delivery, speak with us about the cost and timing before confirming your order."}</p></details><details><summary>Sizing &amp; custom requests</summary><p>{product.sizeNotes || "Tell us your size or the changes you’d like. We’ll explain what is possible, the cost, and how long it will take."}</p></details><details><summary>Looking after your jewelry</summary><p>{product.careInstructions || "Ask us about care for the materials in your piece. We also offer cleaning and repairs at our Takoradi shop."}</p></details><Link className={styles.faqLink} href="/faq">More questions? Read our FAQs →</Link></section>
      </div>
      <section id="customer-reviews" className={styles.reviews}><h2>Customer reviews</h2>{product.reviews.length ? product.reviews.map(review => <article key={review.id} className={styles.review}><div><strong>{review.author}</strong><time>{review.date}</time></div><p aria-label={`${review.rating} out of 5 stars`} className={styles.reviewStars}>{"★".repeat(Math.max(0, Math.min(5, review.rating)))}</p><p>{review.text}</p></article>) : <p>No reviews for this piece yet. <a href="#request-panel">Speak with us if you’d like to know more.</a></p>}</section>
      {relatedProducts}
      {!preview && <RecentlyViewed excludeSlug={product.slug} />}
    </main>
    <Footer />
  </div>
}
