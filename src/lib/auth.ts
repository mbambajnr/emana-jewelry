import "server-only"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { cache } from "react"
import { pbkdf2, timingSafeEqual } from "crypto"
import { promisify } from "node:util"
import { issueAdminToken, readAdminToken } from "./session-token"
const deriveKey = promisify(pbkdf2)

const SESSION_NAME = "admin_session"

export async function createSession(email: string): Promise<void> {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000
  const token = await issueAdminToken(email, expiresAt)
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

  return readAdminToken(token)
})

export async function requireAdmin(): Promise<{ email: string }> {
  const session = await verifySession()
  if (!session || !process.env.ADMIN_EMAIL || session.email !== process.env.ADMIN_EMAIL) {
    redirect("/admin/login")
  }
  return session
}

export async function verifyPassword(input: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":")
  if (!salt || !hash) return false

  const derived = await deriveKey(input, salt, 100000, 64, "sha512")
  const storedHash = Buffer.from(hash, "hex")
  return storedHash.length === derived.length && timingSafeEqual(storedHash, derived)
}
