import { adminSession } from "@/lib/admin-request"
import { publicEmailSettings } from "@/lib/email-settings"
import { saveEmailSettings } from "@/lib/email-settings-handler"

export async function GET() {
  if (!await adminSession()) return Response.json({ error: "Admin sign-in required." }, { status: 401 })
  try { return Response.json({ settings: await publicEmailSettings() }, { headers: { "Cache-Control": "no-store" } }) }
  catch { return Response.json({ error: "Email settings could not be loaded." }, { status: 503 }) }
}
export async function PUT(request: Request) { return saveEmailSettings(request) }
