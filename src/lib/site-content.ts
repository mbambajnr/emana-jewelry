import fields from "./content-fields.json"
import faqs from "./default-faqs.json"
import { normalizeYoutubeUrl } from "./product-media"

export const contentFields = fields
export interface ServiceContent {
  id: string
  title: string
  description: string
  duration: number
  enabled: boolean
  showOnHomepage: boolean
  bookable: boolean
  kind: "custom" | "care" | "advice"
  legacyValue?: string
  pageText?: string
}
export interface SiteDocument {
  copy: Record<string, string>
  services: ServiceContent[]
  faqs: { q: string; a: string }[]
}
const service = (id: string, title: string, description: string, duration: number, legacyValue: string, kind: ServiceContent["kind"], showOnHomepage = false): ServiceContent => ({ id, title, description, duration, legacyValue, kind, showOnHomepage, enabled: true, bookable: true })
export const defaultContent: SiteDocument = {
  copy: Object.fromEntries(fields.map(field => [field.key, field.default])),
  faqs,
  services: [
    service("custom-design", "Talk About Your Custom Design", "Bring us your picture or idea and we’ll discuss the design, materials, and budget.", 30, "Bespoke Design Walkthrough (30 Mins)", "custom"),
    service("gemstone-advice", "Help Choosing Gemstones", "Talk with us about the available stones and options for your piece.", 45, "Gemstone Sourcing Consultation (45 Mins)", "advice"),
    service("sizing-advice", "Help With Sizing and Materials", "Let’s find a comfortable size and suitable materials for your piece.", 30, "Metal Sizing & Scaling Analysis (30 Mins)", "advice"),
    service("cleaning", "Jewelry Cleaning & Polishing", "Let us clean away dirt and polish your jewelry to bring back its shine. We’ll check the materials in your piece first and choose the right cleaning method.", 30, "Jewelry Cleaning & Deep Detailing (30 Mins)", "care", true),
    service("repairs", "Ring Sizing & Repair Advice", "Ring too tight or too loose? We can adjust the size and repair worn bands so you can wear your ring comfortably again.", 45, "Resizing & Repair Assessment (45 Mins)", "care", true),
    service("restoration", "Care for Old & Family Jewelry", "Some pieces mean too much to put away. Let us check your old or family jewelry and explain how we can clean or repair it with care.", 60, "Antique Restoration Consultation (60 Mins)", "care", true),
    { id: "loose-stones", title: "Loose Stone Repairs & Replacement", description: "A stone feeling loose or missing from your jewelry? Bring it in. We’ll check the setting and help secure or replace the stone.", duration: 30, enabled: true, showOnHomepage: true, bookable: false, kind: "care" },
  ],
}
export const serviceValue = (service: ServiceContent) => service.legacyValue || service.id
export const serviceLabel = (service: ServiceContent) => `${service.title} (${service.duration} Mins)`
export const bookableServices = (document: SiteDocument) => document.services.filter(service => service.enabled && service.bookable)

function record(value: unknown): value is Record<string, unknown> { return !!value && typeof value === "object" && !Array.isArray(value) }
function text(value: unknown, label: string, max: number, required = true): string {
  if (typeof value !== "string" || value.length > max || (required && !value.trim())) throw new Error(`Please check ${label}.`)
  return value.trim()
}
function bool(value: unknown): boolean { if (typeof value !== "boolean") throw new Error("Please check the service switches."); return value }
export function validateContent(value: unknown, publish = false): SiteDocument {
  if (!record(value) || !record(value.copy) || !Array.isArray(value.services) || !Array.isArray(value.faqs) || value.services.length > 40 || value.faqs.length > 40 || JSON.stringify(value).length > 200000) throw new Error("Please check the website content.")
  const copy: Record<string, string> = {}
  for (const field of fields) {
    const content = text(value.copy[field.key] ?? field.default, field.label, field.type === "image" ? 1500 : field.type === "short" ? 300 : 5000, field.type !== "youtube")
    if (field.type === "youtube") {
      copy[field.key] = normalizeYoutubeUrl(content) || ""
      continue
    }
    if (field.type === "image") {
      const local = /^\/(?!\/)[a-zA-Z0-9/_.,% -]+$/.test(content) && !content.includes("..")
      let remote = false
      try { const url = new URL(content); remote = url.protocol === "https:" && !url.username && !url.password && url.hostname === "smeepqtjbsoztrcqgqes.supabase.co" } catch {}
      if (!local && !remote) throw new Error("Use an uploaded image or an existing website image path.")
    }
    copy[field.key] = content
  }
  const seen = new Set<string>()
  const services = value.services.map(item => {
    if (!record(item)) throw new Error("Please check the service details.")
    const id = text(item.id, "the service reference", 100)
    if (!/^[a-zA-Z0-9-]+$/.test(id) || seen.has(id)) throw new Error("Service references must be unique.")
    seen.add(id)
    if (!Number.isInteger(item.duration) || Number(item.duration) < 5 || Number(item.duration) > 480 || !["custom", "care", "advice"].includes(String(item.kind))) throw new Error("Choose a service duration from 5 to 480 minutes and a service type.")
    const enabled = bool(item.enabled)
    const pageText = item.pageText === undefined ? undefined : text(item.pageText, "the service page details", 6000, false)
    const original = defaultContent.services.find(service => service.id === id)
    return { id, title: text(item.title, "the service name", 160), description: text(item.description, "the service description", 3000, publish && enabled), duration: Number(item.duration), enabled, showOnHomepage: bool(item.showOnHomepage), bookable: bool(item.bookable), kind: item.kind as ServiceContent["kind"], ...(pageText === undefined ? {} : { pageText }), ...(original?.legacyValue ? { legacyValue: original.legacyValue } : {}) }
  })
  const faqs = value.faqs.map(item => {
    if (!record(item)) throw new Error("Please check the FAQs.")
    return { q: text(item.q, "the question", 300, publish), a: text(item.a, "the answer", 4000, publish) }
  })
  return { copy, services, faqs }
}
