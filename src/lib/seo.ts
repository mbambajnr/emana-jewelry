import type { Metadata } from "next"

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://emanajewelry.com").replace(/\/+$/, "")
export const absoluteUrl = (path: string) => new URL(path, `${SITE_URL}/`).toString()
export const jsonLdString = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c")

export function pageMetadata(title: string, description: string, path: string): Metadata {
  return {
    title, description,
    alternates: { canonical: absoluteUrl(path) },
    openGraph: { type: "website", siteName: "Emana Jewelry", title, description, url: absoluteUrl(path), images: [{ url: absoluteUrl("/og-image.jpg"), width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [absoluteUrl("/og-image.jpg")] },
  }
}

export const businessSchema = {
  "@context": "https://schema.org",
  "@type": "JewelryStore",
  "@id": `${SITE_URL}/#business`,
  name: "Emana Jewelry",
  url: SITE_URL,
  image: absoluteUrl("/og-image.jpg"),
  logo: absoluteUrl("/logo.png"),
  description: "Jewelry in a range of materials and styles, custom designs, cleaning and repairs in Takoradi, Ghana.",
  telephone: "+233242186590",
  email: "emanagold6590@gmail.com",
  address: { "@type": "PostalAddress", streetAddress: "Justmoh Ave", addressLocality: "Takoradi", addressRegion: "Western Region", addressCountry: "GH" },
  openingHoursSpecification: [
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "09:00", closes: "18:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "09:00", closes: "18:00" },
  ],
  hasOfferCatalog: { "@type": "OfferCatalog", name: "Jewelry and Services", itemListElement: ["Custom Jewelry Design", "Jewelry Cleaning and Polishing", "Ring Resizing and Repairs", "Gemstone Sourcing"].map(name => ({ "@type": "Offer", itemOffered: { "@type": "Service", name } })) },
}
