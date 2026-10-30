import { readAdminToken } from "./lib/session-token"
import { NextRequest, NextResponse } from "next/server"

const SESSION_NAME = "admin_session"

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
  const session = token ? await readAdminToken(token) : null
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
