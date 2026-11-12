import { businessInformation } from "./business-information"
import type { Metadata } from "next"

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://emanajewelries.com").replace(/\/+$/, "")
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

export function createBusinessSchema(copy: Record<string, string>) {
  const business = businessInformation(copy)
  const hours = (days: string[], value: string) => value === "Closed" ? [] : [{ "@type": "OpeningHoursSpecification", dayOfWeek: days, opens: value.split("-")[0], closes: value.split("-")[1] }]
  return {
    "@context": "https://schema.org", "@type": "JewelryStore", "@id": `${SITE_URL}/#business`,
    name: "Emana Jewelry", url: SITE_URL, image: absoluteUrl("/og-image.jpg"), logo: absoluteUrl("/logo.png"),
    description: `Jewelry, custom designs, cleaning and repairs in ${business.city}, Ghana.`,
    telephone: business.phone, email: business.email, hasMap: business.map,
    address: { "@type": "PostalAddress", streetAddress: business.street, addressLocality: business.city, addressRegion: business.region, addressCountry: "GH" },
    openingHoursSpecification: [...hours(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], business.weekdays), ...hours(["Saturday"], business.saturday)],
  }
}
export const businessSchema = createBusinessSchema({})
