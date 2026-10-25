import { after, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { sendOrderNotification, sendOrderConfirmation } from "@/lib/notifications"
import { email, InputError, quoteItems, text } from "@/lib/request-validation"

export async function POST(request: Request) {
  let input
  try {
    const body = await request.json()
    input = { name: text(body.name, "your name"), email: email(body.email), phone: text(body.phone, "your phone number", 50), address: text(body.address, "your address", 1000), notes: text(body.notes, "your notes", 4000, true), items: quoteItems(body.items) }
  } catch (error) { return NextResponse.json({ error: error instanceof InputError ? error.message : "Please check your request." }, { status: 400 }) }
  try {
    const products = await prisma.product.findMany({ where: { slug: { in: input.items.map(item => item.slug) } }, include: { images: { take: 1, orderBy: { sortOrder: "asc" } } } })
    if (products.length !== input.items.length) return NextResponse.json({ error: "A piece in your request is no longer listed. Please refresh your cart." }, { status: 400 })
    const items = input.items.map(item => {
      const product = products.find(product => product.slug === item.slug)!
      return { slug: product.slug, name: product.name, image: product.images[0]?.url || "/hero_bg.png", price: 0, quantity: item.quantity }
    })
    // Legacy numeric fields stay zero; this is an unpriced inquiry, not a free order.
    const total = 0
    const order = await prisma.order.create({ data: { name: input.name, email: input.email, phone: input.phone, address: input.address, notes: input.notes || null, items, total, status: "new" } })
    after(async () => {
      await Promise.allSettled([
        sendOrderNotification({ ...input, notes: input.notes || null, items, total, id: order.id }),
        sendOrderConfirmation({ name: input.name, email: input.email, items }),
      ]).then(results => { if (results.some(result => result.status === "rejected")) console.warn("A saved inquiry notification could not be sent.") })
    })
    return NextResponse.json({ success: true, id: order.id }, { status: 201 })
  } catch {
    console.warn("Inquiry could not be saved.")
    return NextResponse.json({ error: "We couldn’t save your request. Please try again or contact us on WhatsApp. Nothing has been confirmed." }, { status: 503 })
  }
}
