import { NextResponse } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"
import { adminSession, isSameOrigin } from "@/lib/admin-request"
import { ContentConflict, CONTENT_TAG, readContentEditor, saveContent } from "@/lib/content-store"
export async function GET() {
  if (!await adminSession()) return NextResponse.json({ error: "Please sign in as the admin." }, { status: 401 })
  try { return NextResponse.json(await readContentEditor(), { headers: { "Cache-Control": "no-store" } }) }
  catch { return NextResponse.json({ error: "We couldn’t load the content. Check the database connection and migrations." }, { status: 503 }) }
}
export async function PUT(request: Request) {
  const session = await adminSession()
  if (!session) return NextResponse.json({ error: "Please sign in as the admin." }, { status: 401 })
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Please save from the admin page." }, { status: 403 })
  let body
  try {
    body = await request.json()
    if (!["save", "publish", "restore"].includes(body.action) || !Number.isSafeInteger(body.version) || body.version < 0 || (body.action === "restore" && (typeof body.revisionId !== "string" || body.revisionId.length > 100))) throw new Error()
  } catch { return NextResponse.json({ error: "Please check your content request." }, { status: 400 }) }
  try {
    const result = await saveContent(body.action, body.version, String(session.email), body.content, body.revisionId)
    if (body.action === "publish") {
      revalidateTag(CONTENT_TAG, { expire: 0 })
      revalidatePath("/", "layout")
    }
    return NextResponse.json({ ...result, message: body.action === "publish" ? "Published. Refresh the website to see your changes." : body.action === "restore" ? "Revision restored to your draft. Preview it before publishing." : "Draft saved. The live website has not changed." })
  } catch (error) {
    if (error instanceof ContentConflict) return NextResponse.json({ error: error.message }, { status: 409 })
    // Validation messages are intended for the editor; database internals are not.
    const message = error instanceof Error && /^(Please|Use |Choose |Service |That )/.test(error.message) ? error.message : "The content could not be saved. Check the database connection and try again."
    return NextResponse.json({ error: message }, { status: message.startsWith("The content") ? 503 : 400 })
  }
}
