import type { SiteDocument } from "./site-content"
import { businessInformation, displayOpeningHours } from "./business-information"
export function publicFaqs(document: SiteDocument) {
  const business = businessInformation(document.copy)
  const replacements: Record<string, string> = { "shop.address": business.address, "shop.phone": business.phone, "shop.email": business.email, "shop.weekdays": displayOpeningHours(business.weekdays), "shop.saturday": displayOpeningHours(business.saturday), "shop.sundayNote": business.sundayNote }
  return document.faqs.map(faq => ({ ...faq, a: faq.a.replace(/\{\{(shop\.[a-zA-Z]+)\}\}/g, (token, name: string) => replacements[name] ?? token) }))
}
export function buyingGuidance(copy: Record<string, string>) {
  return ["price", "delivery", "custom", "metal"].map(name => ({ q: copy[`buying.${name}.question`], a: copy[`buying.${name}.answer`] })).filter(faq => faq.q && faq.a)
}
