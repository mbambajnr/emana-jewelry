import "server-only"
import { createHash, createHmac } from "node:crypto"
import { prisma } from "./db"
import { isSameOrigin } from "./admin-request"

export class RequestError extends Error {
  constructor(message: string, public status = 400) { super(message) }
}
export async function boundedJson(request: Request, maxBytes = 32768): Promise<Record<string, unknown>> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new RequestError("Please submit a JSON request.")
  if (Number(request.headers.get("content-length")) > maxBytes) throw new RequestError("This request is too large.", 413)
  const reader = request.body?.getReader()
  if (!reader) throw new RequestError("Please check your request.")
  const chunks: Uint8Array[] = []; let length = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      length += value.length
      if (length > maxBytes) { await reader.cancel(); throw new RequestError("This request is too large.", 413) }
      chunks.push(value)
    }
    const value = JSON.parse(Buffer.concat(chunks).toString("utf8"))
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error()
    return value
  } catch (error) {
    if (error instanceof RequestError) throw error
    throw new RequestError("Please check your request.")
  } finally { reader.releaseLock() }
}
export async function consumeLimit(scope: string, identity: string, limit: number, seconds = 900) {
  if (!process.env.SESSION_SECRET) throw new RequestError("This service is temporarily unavailable.", 503)
  const window = Math.floor(Date.now() / (seconds * 1000))
  const digest = createHmac("sha256", process.env.SESSION_SECRET).update(`${scope}:${identity}:${window}`).digest("hex")
  const key = `${scope}:${digest}`
  let bucket
  try {
    try { bucket = await prisma.rateBucket.upsert({ where: { key }, create: { key, count: 1, expiresAt: new Date((window + 1) * seconds * 1000) }, update: { count: { increment: 1 } } }) }
    catch (error) {
      if ((error as { code?: string }).code !== "P2002") throw error
      bucket = await prisma.rateBucket.update({ where: { key }, data: { count: { increment: 1 } } })
    }
  } catch { throw new RequestError("This service is temporarily unavailable. Please try again shortly.", 503) }
  if (bucket.count > limit) throw new RequestError("Too many attempts. Please try again in 15 minutes.", 429)
}
export function trustedClient(headers: Headers) {
  // Configure only a header that the hosting proxy replaces, not one it passes through.
  const header = process.env.TRUSTED_CLIENT_IP_HEADER
  return header ? headers.get(header)?.split(",")[0].trim().slice(0, 100) || "unknown" : null
}
export async function publicGuard(request: Request, scope: string) {
  if (!isSameOrigin(request)) throw new RequestError("Please submit from this website.", 403)
  await consumeLimit(`${scope}-site`, "site", scope === "analytics" ? 2000 : trustedClient(request.headers) ? 200 : 30)
  const client = trustedClient(request.headers)
  if (client) await consumeLimit(`${scope}-client`, client, scope === "analytics" ? 100 : 10)
}
export function submissionIdentity(request: Request, input: unknown) {
  const requestKey = request.headers.get("idempotency-key")
  if (!requestKey || !/^[a-zA-Z0-9-]{16,64}$/.test(requestKey)) throw new RequestError("Refresh the page and submit your request again.")
  return { requestKey, requestFingerprint: createHash("sha256").update(JSON.stringify(input)).digest("hex") }
}
export function confirmFingerprint(existing: { requestFingerprint: string | null }, fingerprint: string) {
  if (existing.requestFingerprint !== fingerprint) throw new RequestError("This request reference was already used for different details. Please refresh and try again.", 409)
}
export const canonicalReference = (value: string) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trimEnd()
