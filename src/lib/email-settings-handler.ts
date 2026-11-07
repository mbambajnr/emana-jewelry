import "server-only"
import { adminSession, isSameOrigin } from "./admin-request"
import { boundedJson, consumeLimit, RequestError } from "./request-safety"
import { authorizeEmailSettings, prepareEmailSettings, commitEmailSettings, publicEmailSettings } from "./email-settings"
import { verifyAndTestSmtp } from "./mail-transport"

export async function saveEmailSettings(request: Request, setup = false) {
  if (!isSameOrigin(request)) return Response.json({ error: "Save email settings from this website." }, { status: 403 })
  const session = setup ? null : await adminSession()
  if (!setup && !session) return Response.json({ error: "Admin sign-in required." }, { status: 401 })
  try {
    await consumeLimit("email-settings-save", session?.email || "setup", 5)
    const body = await boundedJson(request, 16384)
    const authorization = await authorizeEmailSettings(body.currentPassword, setup ? body.setupKey ?? null : undefined)
    if (setup) {
      if (typeof body.password !== "string" || !body.password.trim()) throw new RequestError("Enter the Google app password.")
      body.version = (await publicEmailSettings()).version
    }
    const prepared = await prepareEmailSettings(body)
    if (!process.env.ADMIN_EMAIL) throw new Error("Admin address unavailable")
    await verifyAndTestSmtp(prepared.config, process.env.ADMIN_EMAIL)
    await commitEmailSettings(prepared, authorization)
    const message = "Email settings saved. The SMTP server accepted a test email to your admin mailbox. Check your inbox or spam folder, then request a fresh sign-in or reset code."
    return Response.json(setup ? { message } : { message, settings: await publicEmailSettings() }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    const conflict = (error as { code?: string }).code === "P2002"
    const smtpMessage = error instanceof Error && /^SMTP (sign-in failed|connection or delivery failed)\./.test(error.message) ? error.message : undefined
    return Response.json({ error: error instanceof RequestError ? error.message : conflict ? "Email settings changed in another tab. Reload before saving." : smtpMessage || "Email settings could not be saved. Check the server configuration and try again." }, { status: error instanceof RequestError ? error.status : conflict ? 409 : 503 })
  }
}
