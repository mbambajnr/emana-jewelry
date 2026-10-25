import "server-only"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { cache } from "react"
import { pbkdf2Sync, timingSafeEqual } from "crypto"

const SESSION_NAME = "admin_session"

function getSecret(): ArrayBuffer {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error("SESSION_SECRET is not set")
  return new TextEncoder().encode(secret).buffer as ArrayBuffer
}

async function encrypt(payload: Record<string, unknown>): Promise<string> {
  const { subtle } = globalThis.crypto
  const key = await subtle.importKey(
    "raw",
    getSecret(),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const data = new TextEncoder().encode(JSON.stringify(payload))
  const signature = await subtle.sign("HMAC", key, data)
  const base64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
  const payloadBase64 = btoa(JSON.stringify(payload))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
  return `${payloadBase64}.${base64}`
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

    return JSON.parse(
      atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"))
    )
  } catch {
    return null
  }
}

export async function createSession(email: string): Promise<void> {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000
  const token = await encrypt({ email, expiresAt })
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

  const payload = await decrypt(token)
  if (!payload) return null

  const expiresAt = payload.expiresAt as number
  if (typeof expiresAt !== "number" || !Number.isFinite(expiresAt) || Date.now() > expiresAt || typeof payload.email !== "string") return null

  return { email: payload.email as string }
})

export async function requireAdmin(): Promise<{ email: string }> {
  const session = await verifySession()
  if (!session || !process.env.ADMIN_EMAIL || session.email !== process.env.ADMIN_EMAIL) {
    redirect("/admin/login")
  }
  return session
}

export function verifyPassword(input: string, stored: string): boolean {
  const [salt, hash] = stored.split(":")
  if (!salt || !hash) return false

  const derived = pbkdf2Sync(input, salt, 100000, 64, "sha512")
  const storedHash = Buffer.from(hash, "hex")
  return storedHash.length === derived.length && timingSafeEqual(storedHash, derived)
}
