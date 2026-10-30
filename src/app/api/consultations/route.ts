import { readPublishedContent } from "@/lib/content-store"
import { bookableServices, serviceValue, serviceLabel } from "@/lib/site-content"
import { after, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { adminSession } from "@/lib/admin-request"
import { consultationJobs, processNotifications } from "@/lib/notification-jobs"
import { boundedJson, publicGuard, RequestError, submissionIdentity, confirmFingerprint } from "@/lib/request-safety"
import { text, email, InputError } from "@/lib/request-validation"

const formats = [
  "Private Atelier (Takoradi - Justmoh Ave)",
  "Private Atelier (Accra)",
  "WhatsApp Concierge Video Consultation",
]

export async function POST(request: Request) {
  let input, identity: ReturnType<typeof submissionIdentity>
  try {
    await publicGuard(request, "appointment")
    const body = await boundedJson(request)
    input = { name: text(body.name, "your name"), email: email(body.email), phone: text(body.phone, "your phone number", 50, true) || null, service: text(body.service, "the service"), format: text(body.format, "the appointment format"), date: text(body.date, "the preferred date", 10), notes: text(body.notes, "your notes", 4000, true) }
    if (!formats.includes(input.format)) throw new InputError("Please select an available service and appointment format.")
    const date = new Date(`${input.date}T00:00:00Z`)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== input.date || input.date <= new Date().toISOString().slice(0, 10)) throw new InputError("Please choose a valid future date.")
    identity = submissionIdentity(request, input)
  } catch (error) { return NextResponse.json({ ok: false, errors: [error instanceof InputError || error instanceof RequestError ? error.message : "Please check your booking details."] }, { status: error instanceof RequestError ? error.status : 400 }) }
  try {
    const existing = await prisma.consultation.findUnique({ where: { requestKey: identity.requestKey } })
    if (existing) { confirmFingerprint(existing, identity.requestFingerprint); return NextResponse.json({ ok: true, booking: { id: existing.id, status: existing.status } }, { status: 201 }) }
    const content = await readPublishedContent()
    const service = bookableServices(content).find(service => serviceValue(service) === input.service)
    if (!service) return NextResponse.json({ ok: false, errors: ["That service is no longer available. Please refresh and choose another service."] }, { status: 400 })
    const booking = await prisma.$transaction(async tx => {
      const saved = await tx.consultation.create({ data: { ...input, ...identity, service: serviceLabel(service), status: "requested" } })
      await tx.notificationJob.createMany({ data: consultationJobs(saved.id) })
      return saved
    })
    after(async () => { try { await processNotifications(10, booking.id) } catch { console.warn("Notification queue will need another attempt.") } })
    return NextResponse.json({ ok: true, booking: { id: booking.id, status: booking.status } }, { status: 201 })
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      try {
        const saved = await prisma.consultation.findUnique({ where: { requestKey: identity.requestKey } })
        if (saved) { confirmFingerprint(saved, identity.requestFingerprint); return NextResponse.json({ ok: true, booking: { id: saved.id, status: saved.status } }, { status: 201 }) }
      } catch (conflict) { if (conflict instanceof RequestError) return NextResponse.json({ ok: false, errors: [conflict.message] }, { status: conflict.status }) }
    }
    if (error instanceof RequestError) return NextResponse.json({ ok: false, errors: [error.message] }, { status: error.status })
    return NextResponse.json({ ok: false, errors: ["We couldn’t save your appointment request. Please try again or contact us on WhatsApp."] }, { status: 503 })
  }
}

export async function GET() {
  if (!await adminSession()) return NextResponse.json({ error: "Admin sign-in required" }, { status: 401 })
  try {
    const consultations = await prisma.consultation.findMany({ orderBy: { createdAt: "desc" } })
    return NextResponse.json(consultations, { headers: { "Cache-Control": "no-store" } })
  } catch { return NextResponse.json({ error: "Appointments are temporarily unavailable." }, { status: 503 }) }
}
