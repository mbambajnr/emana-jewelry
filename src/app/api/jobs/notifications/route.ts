import { timingSafeEqual } from "node:crypto"
import { processNotifications } from "@/lib/notification-jobs"
export async function POST(request: Request) {
  const secret = process.env.NOTIFICATION_CRON_SECRET
  if (!secret || secret.length < 32) return Response.json({ error: "Notification runner is not configured." }, { status: 503 })
  const expected = Buffer.from(`Bearer ${secret}`), received = Buffer.from(request.headers.get("authorization") || "")
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return Response.json({ error: "Unauthorized" }, { status: 401 })
  try { return Response.json(await processNotifications(30), { headers: { "Cache-Control": "no-store" } }) }
  catch { return Response.json({ error: "Notification runner is unavailable." }, { status: 503 }) }
}
