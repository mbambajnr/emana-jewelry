import type { ServiceContent } from "./site-content"

export const servicePath = (id: string) => `/services/${encodeURIComponent(id)}`
export const publicServices = (services: ServiceContent[]) => services.filter(service => service.enabled)
const details: Record<string, string> = {
  cleaning: "Dirt and everyday wear can leave jewelry looking dull. Bring your piece to our Takoradi shop so we can check its materials, finish, and any stones before discussing a suitable cleaning or polishing method.\n\nTell us about any loose parts, previous repairs, or treatments you know of. Ask for a quote and an estimated collection date before deciding.",
  repairs: "A ring that feels too tight, too loose, or uncomfortable deserves a closer look. Bring it to the shop and tell us what needs changing. The design, material, setting, and condition affect whether an adjustment or repair is suitable.\n\nWe’ll discuss the available options after checking the piece. Ask us to confirm the cost and expected collection date before work begins.",
  restoration: "If an older piece has been sitting in a drawer, bring it along and tell us what you would like to keep or change. Photos of its original condition and information about earlier repairs can help the discussion.\n\nCleaning and repair options depend on the piece’s condition and materials. We’ll talk through the options with you before you decide what to do.",
  "loose-stones": "If a stone moves in its setting or has fallen out, put the piece somewhere safe and bring any loose stone with it. We can discuss the setting, the condition of the piece, and suitable repair or replacement options.\n\nReplacement choices depend on size, shape, material, and availability. Ask for a quote and timing for your particular piece.",
  "custom-design": "Bring a reference photo, sketch, or an idea of what you would like. Tell us who the piece is for, your preferred materials, your budget, and any date you have in mind.\n\nWe’ll discuss the design and available options with you. Confirm the design, measurements, quote, and expected timing before placing your custom request.",
}
export function servicePageText(service: ServiceContent) {
  return service.pageText || details[service.id] || (service.kind === "advice"
    ? "Bring your questions and any jewelry or reference pictures you would like to discuss. Tell us about your preferred materials, size, budget, and any date you have in mind.\n\nContact our Takoradi shop to discuss your options and confirm the cost of any work or materials before deciding."
    : "Tell us what you need and bring your piece or a clear reference photo to our Takoradi shop. The available options depend on the materials, design, and condition.\n\nAsk us to confirm a quote and estimated timing for your request before work begins.")
}
