import "server-only"
import { verifySession } from "./auth"

export async function adminSession() {
  const session = await verifySession()
  return session && process.env.ADMIN_EMAIL && session.email === process.env.ADMIN_EMAIL ? session : null
}
export async function isAdminRequest(request: Request) {
  return !!await adminSession() && request.headers.get("origin") === new URL(request.url).origin
}
