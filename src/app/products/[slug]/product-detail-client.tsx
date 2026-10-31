"use client"

import { trackProductView } from "@/lib/product-analytics"
import { useSiteContent } from "@/components/cms/SiteContentProvider"

import { availabilityLabel, type ProductInformation } from "@/lib/product-information"

import { photosForMetal, productMetalOptions, type MetalOption } from "@/lib/product-options"
import { recordProductView } from "@/lib/recently-viewed"
import RecentlyViewed from "@/components/RecentlyViewed"
import CatalogReturnLink from "@/components/CatalogReturnLink"
import { useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import ProductGallery from "@/components/ProductGallery"
import { websiteDiscount } from "@/lib/website-offer"
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
  metalOptions?: unknown
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


export default function ProductDetailClient({ product, preview = false, relatedProducts, initialMetal }: { product: ProductFromDb; preview?: boolean; relatedProducts?: ReactNode; initialMetal?: MetalOption }) {
  const { copy } = useSiteContent()
  useEffect(() => { if (!preview) { recordProductView(product.slug); trackProductView(product.slug) } }, [product.slug, preview])
  const options = productMetalOptions(product.metalOptions)
  const defaultMetal = options.length === 1 ? options[0] : options.find(option => product.images.some(image => image.url && image.metal === option))
  const [selectedMetal, setSelectedMetal] = useState<MetalOption | undefined>(initialMetal && options.includes(initialMetal) ? initialMetal : defaultMetal)
  const metal = selectedMetal && options.includes(selectedMetal) ? selectedMetal : undefined
  const [choiceError, setChoiceError] = useState(false)
  const discount = websiteDiscount(copy)
  const introduction = product.description.split(/(?<=[.!?])\s|\n/)[0]
  const highlights = [
    ...product.materials.map(material => [material.purity, material.metal, material.weight].filter(Boolean).join(" · ")),
    ...(product.sizeNotes ? [product.sizeNotes] : []),
    ...product.details.map(detail => detail.text),
  ].filter(Boolean).slice(0, 5)
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
    if (options.length && !metal) {
      setChoiceError(true)
      document.getElementById("metal-choice")?.querySelector<HTMLInputElement>("input")?.focus()
      return
    }
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
        <header className={styles.productHeading}>
          <Link href={`/collections/${product.category.slug}`} className={styles.eyebrow}>EMANA JEWELRY / {product.subcategory || product.category.name}</Link>
          <h1 id="product-title" className={styles.title}>{product.name}</h1>
          {product.reviewCount > 0 && product.rating > 0 ? <a className={styles.ratingLink} href="#customer-reviews"><span aria-hidden="true">★</span> {product.rating.toFixed(1)} <span>· {product.reviewCount} {product.reviewCount === 1 ? "review" : "reviews"}</span></a> : <p className={styles.newPiece}>Product reference: {product.sku}</p>}
        </header>
        <ProductGallery key={product.id} metal={metal} name={product.name} images={product.images} youtubeUrl={product.youtubeUrl} />
        <section className={styles.info} aria-label="Choose your piece">
          <p className={styles.introduction}>{introduction.length > 220 ? `${introduction.slice(0, 217).replace(/\s+\S*$/, "")}…` : introduction}</p>
          {options.length > 0 && <fieldset id="metal-choice" className={styles.metalOptions} aria-describedby="metal-choice-note">
            <legend>Choose your metal{metal ? `: ${metal}` : ""}</legend>
            <div>{options.map(option => <label key={option} className={styles.metalOption}>
              <input type="radio" name="product-metal" value={option} checked={metal === option} onChange={() => { setSelectedMetal(option); setChoiceError(false); setAdded(false) }} />
              <span className={option === "Gold" ? styles.goldSwatch : styles.silverSwatch} aria-hidden="true" />{option}
            </label>)}</div>
            <p id="metal-choice-note">We’ll confirm the material, finish, and availability with your quote.</p>
            {choiceError && <p role="alert" className={styles.choiceError}>Choose a metal before adding this piece to your quote list.</p>}
          </fieldset>}
          {highlights.length > 0 && <div className={styles.highlights}><h2>About this piece</h2><ul>{highlights.map((highlight, index) => <li key={index}>{highlight}</li>)}</ul></div>}
          <a className={styles.detailLink} href="#product-details">See full description &amp; details ↓</a>
          <p className={styles.sizingPrompt}>Need help with sizing? <a href="#delivery-and-care">See sizing and care information</a>.</p>
        </section>
        <aside id="request-panel" className={styles.buyBox} aria-label="Request a quote">
          <span className={styles.boxEyebrow}>DIRECT FROM EMANA</span>
          <h2>Request today’s price</h2>
          {discount && <p className={styles.offerLine}>{discount}% off your jewelry quote <a href="#offer-terms">Website offer</a></p>}
          <p className={styles.availability}><span aria-hidden="true">●</span> {availabilityLabel(product)}</p>
          {options.length > 0 && <p className={styles.selectionSummary}>Metal: <a href="#metal-choice">{metal || "Choose Gold or Silver"}</a></p>}
          <div className={styles.quantityRow}><label className={styles.quantityLabel} htmlFor="product-quantity">Quantity</label>
          <select id="product-quantity" value={quantity} className={styles.quantity} onChange={event => { setQuantity(Number(event.target.value)); setAdded(false) }}>{Array.from({ length: 10 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}</select></div>
          {preview ? <button disabled className={styles.whatsappAction}>Get Price on WhatsApp</button> : <WhatsappButton quantity={quantity} metal={metal} productName={product.name} productUrl={`/products/${encodeURIComponent(product.slug)}`} className={styles.whatsappAction} iconSize={18} label="Get Price on WhatsApp" />}
          <button className={styles.quoteAction} onClick={requestQuote}>{added ? "Added to your quote list ✓" : "Add to Quote List"}</button>
          {added && <p role="status" className={styles.addedMessage}>{preview ? "Preview only — no item was saved." : "Your piece has been added."} <Link href="/cart">View your quote list →</Link></p>}
          <p className={styles.noPayment}>Ask for a quote. No payment taken here.</p>
          {discount && <p id="offer-terms" className={styles.offerTerms}>Website discount applies to the confirmed jewelry price. Delivery is quoted separately.</p>}
          <div className={styles.delivery}><span aria-hidden="true">⌖</span><p className={styles.guidanceSummary}><strong>Collection or delivery</strong><br />{product.deliveryNotes || copy["product.deliverySummary"]}</p></div>
          <a className={styles.panelDetails} href="#delivery-and-care">Delivery, care &amp; returns ↓</a>
          <button className={styles.saveAction} onClick={save} aria-pressed={wishlisted}>{wishlisted ? "♥ Saved to your wishlist" : "♡ Save for later"}</button>
        </aside>
      </div>
      <nav className={styles.sectionLinks} aria-label="More about this product"><a href="#product-details">Product details</a><a href="#delivery-and-care">Delivery &amp; care</a><a href="#customer-reviews">Customer reviews</a></nav>
      <div className={styles.lowerGrid}>
        <section id="product-details" className={styles.detailSection}><span className={styles.eyebrow}>THE FINER DETAILS</span><h2>Know your piece</h2><section aria-label="About this piece" className={styles.fullDescription}><h3>Product description</h3><p>{product.description}</p>{product.details.length > 0 && <ul>{product.details.map((detail, index) => <li key={index}>{detail.text}</li>)}</ul>}</section><dl className={styles.specifications}>
          <div><dt>Product reference</dt><dd>{product.sku}</dd></div><div><dt>Collection</dt><dd>{product.category.name}</dd></div><div><dt>Metal choices</dt><dd>{options.join(" or ")}</dd></div>
          {product.sizeNotes && <div><dt>Sizes</dt><dd>{product.sizeNotes}</dd></div>}
          {product.materials.map((material, i) => <div key={`metal-${i}`}><dt>{material.metal}</dt><dd>{[material.purity, material.weight].filter(Boolean).join(" · ")}</dd></div>)}
          {product.stones.map((stone, i) => <div key={`stone-${i}`}><dt>{stone.type}</dt><dd>{[stone.carat && `${stone.carat} ct`, stone.color, stone.clarity, stone.cut, stone.certification].filter(Boolean).join(" · ") || "Ask us for details"}</dd></div>)}
        </dl></section>
        <section id="delivery-and-care" className={styles.detailSection}><span className={styles.eyebrow}>BEFORE YOU ORDER</span><h2>A little peace of mind</h2><details open><summary>Collection &amp; delivery</summary><p>{product.deliveryNotes || copy["product.deliveryDetails"]}</p></details><details><summary>Sizing &amp; custom requests</summary><p>{product.sizeNotes || copy["product.sizingDetails"]}</p></details><details><summary>Looking after your jewelry</summary><p>{product.careInstructions || copy["product.careDetails"]}</p></details><details><summary>Returns &amp; changes</summary><p>{copy["product.returnsDetails"]}</p></details><Link className={styles.faqLink} href="/faq">More questions? Read our FAQs →</Link></section>
      </div>
      {relatedProducts}
      <section id="customer-reviews" className={styles.reviews}><h2>Customer reviews</h2>{product.reviews.length ? product.reviews.map(review => <article key={review.id} className={styles.review}><div><strong>{review.author}</strong><time>{review.date}</time></div><p aria-label={`${review.rating} out of 5 stars`} className={styles.reviewStars}>{"★".repeat(Math.max(0, Math.min(5, review.rating)))}</p><p>{review.text}</p></article>) : <p>No reviews for this piece yet. <a href="#request-panel">Speak with us if you’d like to know more.</a></p>}</section>
      {!preview && <RecentlyViewed excludeSlug={product.slug} />}
    </main>
    <Footer />
    {!preview && <nav className={styles.mobileEnquiry} aria-label="Quick product enquiry">
      <a href={options.length ? "#metal-choice" : "#request-panel"} className={styles.mobileChoice} aria-label={`Change metal choice, currently ${metal || "unselected"}`}><span>{metal || "Choose metal"}</span><small>Change choice ↑</small></a>
      <WhatsappButton quantity={quantity} metal={metal} productName={product.name} productUrl={`/products/${encodeURIComponent(product.slug)}`} className={styles.mobileWhatsapp} label="Get Price" />
    </nav>}
  </div>
}
