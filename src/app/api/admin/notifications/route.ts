import { prisma } from "@/lib/db"
import { adminSession, isSameOrigin } from "@/lib/admin-request"
import { boundedJson, consumeLimit, RequestError } from "@/lib/request-safety"
import { processNotifications } from "@/lib/notification-jobs"

export async function GET() {
  if (!await adminSession()) return Response.json({ error: "Admin sign-in required" }, { status: 401 })
  try { return Response.json(await prisma.notificationJob.findMany({ take: 100, orderBy: { createdAt: "desc" }, select: { id: true, kind: true, recordId: true, status: true, attempts: true, nextAttemptAt: true, lastError: true, createdAt: true } }), { headers: { "Cache-Control": "no-store" } }) }
  catch { return Response.json({ error: "Email delivery records could not be loaded." }, { status: 503 }) }
}
export async function POST(request: Request) {
  const session = await adminSession()
  if (!session || !isSameOrigin(request)) return Response.json({ error: "Please retry from the admin page." }, { status: 403 })
  try {
    await consumeLimit("mail-retry", session.email, 10)
    const body = await boundedJson(request, 2000)
    if (typeof body.id !== "string" || body.id.length > 100) throw new RequestError("Choose a valid delivery record.")
    const reset = await prisma.notificationJob.updateMany({ where: { id: body.id, OR: [{ status: { in: ["pending", "failed"] } }, { status: "working", lockedUntil: { lt: new Date() } }] }, data: { status: "pending", attempts: 0, nextAttemptAt: new Date(), lockToken: null, lockedUntil: null, lastError: null } })
    if (!reset.count) throw new RequestError("This email was already sent or is being processed.", 409)
    const job = await prisma.notificationJob.findUnique({ where: { id: body.id } })
    if (!job) throw new RequestError("Delivery record no longer exists.", 404)
    return Response.json(await processNotifications(10, job.recordId))
  } catch (error) { return Response.json({ error: error instanceof RequestError ? error.message : "Delivery could not be retried. Check the email connection." }, { status: error instanceof RequestError ? error.status : 503 }) }
}
