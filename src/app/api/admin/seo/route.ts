import { isSameOrigin } from "@/lib/admin-request"
import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { verifySession } from "@/lib/auth"
import { readSearchSettings, saveSearchSettings, SEARCH_SETTINGS_TAG } from "@/lib/search-settings"
import { verificationToken } from "@/lib/search-verification"

async function authorized() {
  const session = await verifySession()
  return !!session && !!process.env.ADMIN_EMAIL && session.email === process.env.ADMIN_EMAIL
}

export async function GET() {
  if (!await authorized()) return NextResponse.json({ error: "Please sign in as the admin." }, { status: 401 })
  try {
    return NextResponse.json({ settings: await readSearchSettings(), storage: "database" }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json({ error: "We couldn’t load your settings. Check the database connection and migrations, then try again." }, { status: 503 })
  }
}

export async function PUT(request: Request) {
  if (!await authorized()) return NextResponse.json({ error: "Please sign in as the admin." }, { status: 401 })
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Please save from the admin page." }, { status: 403 })
  let settings
  try {
    const body = await request.json()
    settings = { googleVerification: verificationToken(body.googleVerification, "google"), bingVerification: verificationToken(body.bingVerification, "bing") }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Please check the verification codes." }, { status: 400 })
  }
  try {
    await saveSearchSettings(settings)
    revalidateTag(SEARCH_SETTINGS_TAG, { expire: 0 })
    return NextResponse.json({ settings, message: "Your codes are saved. Open Google or Bing to complete verification." })
  } catch {
    return NextResponse.json({ error: "Your codes could not be saved. Check the database connection and migrations, then try again." }, { status: 503 })
  }
}
