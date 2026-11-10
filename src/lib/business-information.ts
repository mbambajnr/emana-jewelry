import fields from "./content-fields.json"
const defaults = Object.fromEntries(fields.filter(field => field.key.startsWith("business.")).map(field => [field.key, field.default]))
export function businessInformation(copy: Record<string, string> = {}) {
  const value = (name: string) => copy[`business.${name}`] ?? defaults[`business.${name}`]
  const street = value("street"), city = value("city"), region = value("region"), phone = value("phone"), email = value("email")
  const address = `${street}, ${city}, ${region}, Ghana`
  return { street, city, region, phone, email, address, weekdays: value("weekdays"), saturday: value("saturday"), sundayNote: value("sundayNote"), whatsapp: `https://wa.me/${phone.replace(/\D/g, "")}`, map: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Emana Jewelry, ${address}`)}` }
}
export function validOpeningHours(value: string) {
  if (value === "Closed") return true
  if (!/^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$/.test(value)) return false
  const [opens, closes] = value.split("-")
  return opens < closes
}
export function displayOpeningHours(value: string) {
  if (value === "Closed") return value
  return value.split("-").map(time => {
    const [hour, minute] = time.split(":").map(Number)
    return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`
  }).join(" – ")
}
