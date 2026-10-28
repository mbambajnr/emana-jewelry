import "server-only"
import { verifySession } from "./auth"

export async function adminSession() {
  const session = await verifySession()
  return session && process.env.ADMIN_EMAIL && session.email === process.env.ADMIN_EMAIL ? session : null
}
export function isSameOrigin(request: Request): boolean {
  try {
    const origin = request.headers.get("origin")
    if (!origin) return false
    const target = new URL(request.url)
    const host = request.headers.get("host")
    if (host) target.host = host
    return new URL(origin).origin === target.origin
  } catch { return false }
}
export async function isAdminRequest(request: Request) {
  return !!await adminSession() && isSameOrigin(request)
}
