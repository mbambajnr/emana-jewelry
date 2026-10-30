// Shared by the proxy and server-side authorization so revocation is consistent.
const encode = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")
const decode = (value: string) => Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/")), char => char.charCodeAt(0))
async function key() {
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32 || !process.env.ADMIN_PASSWORD_HASH) throw new Error("Admin authentication is not configured")
  return crypto.subtle.importKey("raw", new TextEncoder().encode(process.env.SESSION_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"])
}
async function credentialVersion(signingKey: CryptoKey) {
  return encode(new Uint8Array(await crypto.subtle.sign("HMAC", signingKey, new TextEncoder().encode(`admin-credentials:${process.env.ADMIN_PASSWORD_HASH}`))))
}
export async function issueAdminToken(email: string, expiresAt: number) {
  const signingKey = await key()
  const data = new TextEncoder().encode(JSON.stringify({ email, expiresAt, credentialVersion: await credentialVersion(signingKey) }))
  return `${encode(data)}.${encode(new Uint8Array(await crypto.subtle.sign("HMAC", signingKey, data)))}`
}
export async function readAdminToken(token: string) {
  try {
    const parts = token.split(".")
    if (parts.length !== 2 || token.length > 3000) return null
    const signingKey = await key(), data = decode(parts[0])
    if (!await crypto.subtle.verify("HMAC", signingKey, decode(parts[1]), data)) return null
    const payload = JSON.parse(new TextDecoder().decode(data))
    if (typeof payload.expiresAt !== "number" || !Number.isFinite(payload.expiresAt) || payload.expiresAt <= Date.now() || payload.email !== process.env.ADMIN_EMAIL || payload.credentialVersion !== await credentialVersion(signingKey)) return null
    return { email: String(payload.email) }
  } catch { return null }
}
