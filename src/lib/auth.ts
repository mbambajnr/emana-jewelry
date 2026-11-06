import "server-only"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { cache } from "react"
import { readAdminPasswordHash } from "./admin-credentials"
export { verifyPassword } from "./password-crypto"
import { issueAdminToken, readAdminToken } from "./session-token"

const SESSION_NAME = "admin_session"

export async function createSession(email: string, verifiedPasswordHash?: string): Promise<void> {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000
  const token = await issueAdminToken(email, expiresAt, verifiedPasswordHash || await readAdminPasswordHash())
  const cookieStore = await cookies()
  cookieStore.set(SESSION_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(expiresAt),
    sameSite: "lax",
    path: "/",
  })
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_NAME)
}

export const verifySession = cache(async () => {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_NAME)?.value
  if (!token) return null

  try { return await readAdminToken(token, await readAdminPasswordHash()) } catch { return null }
})

export async function requireAdmin(): Promise<{ email: string }> {
  const session = await verifySession()
  if (!session || !process.env.ADMIN_EMAIL || session.email !== process.env.ADMIN_EMAIL) {
    redirect("/admin/login")
  }
  return session
}
