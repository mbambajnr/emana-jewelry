import { productMetalOptions, photosForMetal } from "@/lib/product-options"
import { after, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { orderJobs, processNotifications } from "@/lib/notification-jobs"
import { boundedJson, publicGuard, RequestError, submissionIdentity, confirmFingerprint, canonicalReference } from "@/lib/request-safety"
import { email, InputError, quoteItems, text } from "@/lib/request-validation"
import { readPublishedContent } from "@/lib/content-store"
import { websiteDiscount, offerRecord } from "@/lib/website-offer"

export async function POST(request: Request) {
  let identity: ReturnType<typeof submissionIdentity> | undefined
  try {
    await publicGuard(request, "inquiry")
    const body = await boundedJson(request)
    const input = { name: text(body.name, "your name"), email: email(body.email), phone: text(body.phone, "your phone number", 50), address: text(body.address, "your address", 1000), notes: text(body.notes, "your notes", 4000, true), items: quoteItems(body.items) }
    identity = submissionIdentity(request, input)
    const existing = await prisma.order.findUnique({ where: { requestKey: identity.requestKey } })
    if (existing) { confirmFingerprint(existing, identity.requestFingerprint); return NextResponse.json({ success: true, id: existing.id }, { status: 201 }) }
    const products = await prisma.product.findMany({ where: { slug: { in: input.items.map(item => item.slug) } }, include: { images: { orderBy: { sortOrder: "asc" } } } })
    const used = new Set<string>()
    const items = input.items.map(item => {
      const product = products.find(product => canonicalReference(product.slug) === canonicalReference(item.slug))
      if (!product) throw new RequestError("A piece in your request is no longer listed. Please refresh your cart.")
      const key = `${product.id || product.slug}:${item.metal || ""}`
      if (used.has(key)) throw new RequestError("Please remove repeated product and metal selections.")
      used.add(key)
      if (item.metal && !productMetalOptions(product.metalOptions).includes(item.metal)) throw new RequestError(`${item.metal} is no longer an option for ${product.name}. Please update your request.`)
      return { slug: product.slug, name: product.name, image: photosForMetal(product.images, item.metal)[0]?.url || "/hero_bg.png", price: 0, quantity: item.quantity, ...(item.metal ? { metal: item.metal } : {}) }
    })
    const discount = websiteDiscount((await readPublishedContent()).copy)
    const notes = [input.notes, discount ? offerRecord(discount) : ""].filter(Boolean).join("\n\n") || null
    const order = await prisma.$transaction(async tx => {
      const saved = await tx.order.create({ data: { ...identity!, name: input.name, email: input.email, phone: input.phone, address: input.address, notes, items, total: 0, status: "new" } })
      await tx.notificationJob.createMany({ data: orderJobs(saved.id) })
      return saved
    })
    after(async () => { try { await processNotifications(10, order.id) } catch { console.warn("Notification queue will need another attempt.") } })
    return NextResponse.json({ success: true, id: order.id }, { status: 201 })
  } catch (error) {
    if ((error as { code?: string }).code === "P2002" && identity) {
      try {
        const saved = await prisma.order.findUnique({ where: { requestKey: identity.requestKey } })
        if (saved) { confirmFingerprint(saved, identity.requestFingerprint); return NextResponse.json({ success: true, id: saved.id }, { status: 201 }) }
      } catch (conflict) { if (conflict instanceof RequestError) return NextResponse.json({ error: conflict.message }, { status: conflict.status }) }
    }
    const status = error instanceof RequestError ? error.status : error instanceof InputError ? 400 : 503
    return NextResponse.json({ error: error instanceof RequestError || error instanceof InputError ? error.message : "We couldn’t save your request. Please try again or contact us on WhatsApp. Nothing has been confirmed." }, { status, ...(status === 429 ? { headers: { "Retry-After": "900" } } : {}) })
  }
}
