import { isSameOrigin } from "@/lib/admin-request"
import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { verifySession } from "@/lib/auth"
import { parseSocialLinks } from "@/lib/social-links"
import { readSocialLinks, writeSocialLinks, SOCIAL_SETTINGS_TAG } from "@/lib/social-settings"

async function authorized() {
  const session = await verifySession()
  return !!session && !!process.env.ADMIN_EMAIL && session.email === process.env.ADMIN_EMAIL
}
export async function GET() {
  if (!await authorized()) return NextResponse.json({ error: "Please sign in as the admin." }, { status: 401 })
  try {
    return NextResponse.json({ links: await readSocialLinks(), local: false }, { headers: { "Cache-Control": "no-store" } })
  } catch { return NextResponse.json({ error: "We couldn’t load your links. Check the database connection and migrations, then try again." }, { status: 503 }) }
}
export async function PUT(request: Request) {
  if (!await authorized()) return NextResponse.json({ error: "Please sign in as the admin." }, { status: 401 })
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Please save from the admin page." }, { status: 403 })
  let links
  try { links = parseSocialLinks(await request.json()) }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Please check your links." }, { status: 400 }) }
  try {
    await writeSocialLinks(links)
    revalidateTag(SOCIAL_SETTINGS_TAG, { expire: 0 })
    return NextResponse.json({ links, message: "Your social links are saved. Refresh the website to see them in the footer." })
  } catch { return NextResponse.json({ error: "Your links could not be saved. Check the database connection and migrations, then try again." }, { status: 503 }) }
}
