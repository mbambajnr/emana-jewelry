import { describe, expect, it } from "vitest"
import { bookableServices, defaultContent, serviceValue, validateContent } from "@/lib/site-content"
const copy = () => structuredClone(defaultContent)
describe("website content validation", () => {
  it("starts with the current site and preserves legacy service references", () => {
    const parsed = validateContent(copy(), true)
    expect(parsed.copy["hero.0.title"]).toBe("Shop")
    expect(serviceValue(bookableServices(parsed)[0])).toBe("Bespoke Design Walkthrough (30 Mins)")
  })
  it("lets drafts be incomplete but rejects incomplete published FAQs and enabled services", () => {
    const draft = copy(); draft.faqs.push({ q: "", a: "" }); draft.services[0].description = ""
    expect(() => validateContent(draft)).not.toThrow()
    expect(() => validateContent(draft, true)).toThrow()
  })
  it("rejects duplicate service identities and unsafe image URLs", () => {
    const duplicate = copy(); duplicate.services.push(duplicate.services[0])
    expect(() => validateContent(duplicate)).toThrow(/unique/)
    for (const url of ["javascript:alert(1)", "//attacker.test/a.jpg", "http://127.0.0.1/private", "https://attacker.test/a.jpg"]) {
      const document = copy(); document.copy["services.image"] = url
      expect(() => validateContent(document)).toThrow(/image/)
    }
  })
  it("does not accept forged legacy service values or arbitrary content fields", () => {
    const draft = copy(); draft.services[0].legacyValue = "attacker"; draft.copy["arbitrary.html"] = "bad"
    const parsed = validateContent(draft)
    expect(parsed.services[0].legacyValue).toBe(defaultContent.services[0].legacyValue)
    expect(parsed.copy).not.toHaveProperty("arbitrary.html")
  })
})
