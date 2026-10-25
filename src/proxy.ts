import { NextRequest, NextResponse } from "next/server"

const SESSION_NAME = "admin_session"

function getSecret(): ArrayBuffer {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error("SESSION_SECRET is not set")
  return new TextEncoder().encode(secret).buffer as ArrayBuffer
}

async function decrypt(token: string): Promise<Record<string, unknown> | null> {
  try {
    const [payloadBase64, signatureBase64] = token.split(".")
    if (!payloadBase64 || !signatureBase64) return null

    const { subtle } = globalThis.crypto
    const key = await subtle.importKey(
      "raw",
      getSecret(),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    )

    const data = new TextEncoder().encode(
      atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"))
    )
    const signature = Uint8Array.from(
      atob(signatureBase64.replace(/-/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0)
    )

    const valid = await subtle.verify("HMAC", key, signature, data)
    if (!valid) return null

    const payload = JSON.parse(
      atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"))
    )

    const expiresAt = payload.expiresAt as number
    if (typeof expiresAt !== "number" || !Number.isFinite(expiresAt) || Date.now() > expiresAt || typeof payload.email !== "string") return null

    return payload
  } catch {
    return null
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isAdminRoute = pathname.startsWith("/admin")
  const isLoginPage = pathname === "/admin/login"
  const isStaticAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"

  if (isStaticAsset) {
    return NextResponse.next()
  }

  const token = request.cookies.get(SESSION_NAME)?.value
  const session = token ? await decrypt(token) : null
  const isAuthenticated = session !== null && session.email === process.env.ADMIN_EMAIL

  if (isAdminRoute && !isLoginPage && !isAuthenticated) {
    const loginUrl = new URL("/admin/login", request.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isLoginPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  return NextResponse.next()
}
