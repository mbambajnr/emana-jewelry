export function websiteDiscount(copy: Record<string, string>): number | null {
  const value = copy["offer.percent"]?.trim()
  return value && /^(?:[1-9]|[1-9][0-9]|100)$/.test(value) ? Number(value) : null
}
export const offerMessage = (percent: number) => `Please apply the ${percent}% website discount to the jewelry price.`
export const offerRecord = (percent: number) => `Website offer: ${percent}% off the confirmed jewelry price. Delivery is quoted separately.`
