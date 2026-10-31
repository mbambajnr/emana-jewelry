import { expect, it, vi } from "vitest"
import { render } from "@testing-library/react"
import { defaultContent } from "@/lib/site-content"
vi.mock("@/lib/content-store", () => ({ publishedContent: async () => ({ ...defaultContent, services: [{ ...defaultContent.services[0], title: "Jewelry Engraving", enabled: true }, { ...defaultContent.services[1], title: "Hidden service", enabled: false }] }) }))
vi.mock("@/app/home-content", () => ({ default: () => null }))
vi.mock("@/components/FeaturedProducts", () => ({ default: () => null }))
vi.mock("@/lib/social-settings", () => ({ publicSocialLinks: async () => ({ instagram: "https://www.instagram.com/emana_test", facebook: "", tiktok: "" }) }))
import HomePage from "@/app/page"
it("describes enabled published services in homepage search data", async () => {
  const { container } = render(await HomePage())
  const schema = JSON.parse(container.querySelector('script[type="application/ld+json"]')!.textContent!)
  expect(schema["@graph"][0].hasOfferCatalog.itemListElement).toHaveLength(1)
  expect(schema["@graph"][0].hasOfferCatalog.itemListElement[0].itemOffered.name).toBe("Jewelry Engraving")
  expect(schema["@graph"][0].hasOfferCatalog.itemListElement[0].itemOffered.url).toContain("/services/custom-design")
  expect(schema["@graph"][0].sameAs).toEqual(["https://www.instagram.com/emana_test"])
  expect(schema["@graph"][0].openingHoursSpecification[1]).toMatchObject({ opens: "09:00", closes: "18:00" })
})
