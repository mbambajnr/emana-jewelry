import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { adminSession, isAdminRequest } from "@/lib/admin-request"
import { validStage } from "@/lib/request-stages"
import { text } from "@/lib/request-validation"

type Context = { params: Promise<{ kind: string; id: string }> }
export async function GET(_request: Request, { params }: Context) {
  if (!await adminSession()) return NextResponse.json({ error: "Admin sign-in required" }, { status: 401 })
  const { kind, id } = await params
  if (kind !== "inquiry" && kind !== "appointment") return NextResponse.json({ error: "Unknown request type" }, { status: 400 })
  try {
    const history = await prisma.requestActivity.findMany({ where: { requestKind: kind, requestId: id }, orderBy: { createdAt: "desc" }, take: 50 })
    return NextResponse.json(history, { headers: { "Cache-Control": "no-store" } })
  } catch { return NextResponse.json({ error: "Could not load the activity log." }, { status: 503 }) }
}
export async function PATCH(request: Request, { params }: Context) {
  if (!await isAdminRequest(request)) return NextResponse.json({ error: "Admin sign-in required" }, { status: 401 })
  const actor = (await adminSession())!.email
  const { kind, id } = await params
  if (kind !== "inquiry" && kind !== "appointment") return NextResponse.json({ error: "Unknown request type" }, { status: 400 })
  let status: string, previous: string, note: string
  try {
    const body = await request.json()
    if (!validStage(kind, body.status)) throw new Error()
    status = body.status
    previous = text(body.previous, "the previous status", 40)
    note = text(body.note, "your note", 2000, true)
    if (status === previous && !note) throw new Error()
  } catch { return NextResponse.json({ error: "Choose a stage or add a note before saving." }, { status: 400 }) }
  try {
    const changed = await prisma.$transaction(async tx => {
      const result = kind === "inquiry" ? await tx.order.updateMany({ where: { id, status: previous }, data: { status } }) : await tx.consultation.updateMany({ where: { id, status: previous }, data: { status } })
      if (result.count !== 1) return false
      await tx.requestActivity.create({ data: { requestKind: kind, requestId: id, fromStatus: previous, toStatus: status, note, actor } })
      return true
    })
    if (!changed) return NextResponse.json({ error: "This request changed or no longer exists. Refresh before trying again." }, { status: 409 })
    return NextResponse.json({ status })
  } catch { return NextResponse.json({ error: "Your change could not be saved. Please try again." }, { status: 503 }) }
}
