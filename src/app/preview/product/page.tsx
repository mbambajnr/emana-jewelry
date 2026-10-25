import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Header from "@/components/Header"
import ProductDetailClient, { type ProductFromDb } from "@/app/products/[slug]/product-detail-client"

export const metadata: Metadata = { title: "Product Design Preview", robots: { index: false, follow: false } }
const product: ProductFromDb = {
  id: "design-preview", slug: "design-preview", name: "Handmade Gold Signet Ring", subcategory: "Signet Rings",
  price: 0, originalPrice: null, available: true, sku: "PREVIEW-001", rating: 0, reviewCount: 0,
  description: "A classic signet shape with a personal touch. Speak with our goldsmiths about the finish, fit, and engraving you have in mind.",
  category: { slug: "rings", name: "Rings" },
  images: [ { url: "/gold_signet_ring.jpg", alt: "Sample gold signet ring", sortOrder: 0 }, { url: "/gold_signet_ring.jpg", alt: "Sample gallery photo two — replace with your own side view", sortOrder: 1 }, { url: "/gold_signet_ring.jpg", alt: "Sample gallery photo three — replace with your own close-up", sortOrder: 2 } ],
  materials: [{ metal: "Gold", purity: "18K", weight: null }], stones: [],
  details: [{ text: "Choose your preferred size and finish." }, { text: "Ask about adding initials or a personal engraving." }, { text: "Your final design and price are agreed before we start." }], reviews: [],
}
export default function ProductPreview() {
  if (process.env.NODE_ENV === "production") notFound()
  return <><Header /><div style={{ padding: "96px 24px 0", color: "#6c5225", textAlign: "center" }}>Design preview · sample photos and details · not a live product listing</div><ProductDetailClient product={product} preview /></>
}
