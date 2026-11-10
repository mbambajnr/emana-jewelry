import { expect, it } from "vitest"
import { businessInformation, displayOpeningHours } from "@/lib/business-information"
import { createBusinessSchema } from "@/lib/seo"
import { defaultContent, validateContent } from "@/lib/site-content"
import { publicFaqs, buyingGuidance } from "@/lib/buying-guidance"
import legacy from "@/lib/legacy-faqs.json"
it("uses the same edited shop details in visible answers, contact links and structured data", () => {
  const document = structuredClone(defaultContent)
  Object.assign(document.copy, { "business.street": "New Street", "business.city": "Test Town", "business.phone": "+233201234567", "business.email": "shop@example.invalid", "business.weekdays": "10:00-17:30", "business.saturday": "Closed" })
  const validated = validateContent(document, true), business = businessInformation(validated.copy), schema = createBusinessSchema(validated.copy)
  expect(business.whatsapp).toBe("https://wa.me/233201234567")
  expect(schema.address.streetAddress).toBe("New Street"); expect(schema.telephone).toBe(business.phone)
  expect(schema.openingHoursSpecification).toHaveLength(1)
  expect(schema.openingHoursSpecification[0]).toMatchObject({ opens: "10:00", closes: "17:30" })
  const answers = publicFaqs(validated)
  expect(answers.find(faq => faq.q.includes("opening hours"))?.a).toContain("Saturday: Closed")
  expect(answers.find(faq => faq.q.includes("located"))?.a).toContain(business.address)
  expect(JSON.stringify(answers)).not.toContain("{{shop.")
  expect(displayOpeningHours("10:00-17:30")).toBe("10:00 AM – 5:30 PM")
})
it("upgrades untouched legacy answers without overwriting a customised answer", () => {
  const document = structuredClone(defaultContent); document.faqs = structuredClone(legacy)
  const updated = validateContent(document, true)
  expect(publicFaqs(updated).find(faq => faq.q.includes("opening hours"))?.a).toContain("Saturday: 9:00 AM – 6:00 PM")
  expect(updated.faqs.find(faq => faq.q.includes("custom piece take"))?.a).not.toContain("1-2 weeks")
  document.faqs[0].a = "A deliberately customised answer."
  expect(validateContent(document).faqs[0].a).toBe("A deliberately customised answer.")
  expect(buyingGuidance(updated.copy)).toHaveLength(4)
})
it("rejects malformed contact links and inconsistent hours before publishing", () => {
  for (const [key, value] of [["business.phone", "javascript:alert(1)"], ["business.email", "not-email"], ["business.saturday", "18:00-09:00"], ["business.weekdays", "99:00-24:00"]]) {
    const document = structuredClone(defaultContent); document.copy[key] = value
    expect(() => validateContent(document, true)).toThrow()
  }
})
