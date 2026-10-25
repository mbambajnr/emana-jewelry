export function customerWhatsAppLink(phone: string | null, message: string): string | null {
  if (!phone) return null
  let digits = phone.replace(/[^0-9]/g, "")
  if (digits.length === 10 && digits.startsWith("0")) digits = `233${digits.slice(1)}`
  else if (digits.startsWith("00")) digits = digits.slice(2)
  if (!/^[1-9]\d{7,14}$/.test(digits)) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}
