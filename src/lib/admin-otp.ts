import "server-only"
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto"
import { prisma } from "./db"
import { consumeLimit } from "./request-safety"
import { sendAdminLoginCode } from "./notifications"

export const OTP_LIFETIME = 10 * 60 * 1000
export class OtpError extends Error {
  constructor(message: string, public restart = false) { super(message) }
}
function settings() {
  const { ADMIN_EMAIL: email, ADMIN_PASSWORD_HASH: password, SESSION_SECRET: secret, RESEND_API_KEY: mail } = process.env
  if (!email || !password || !secret || secret.length < 32 || !mail) throw new OtpError("Admin email verification is unavailable. Contact the site administrator.", true)
  const hmac = (value: string) => createHmac("sha256", secret).update(value).digest("hex")
  return { email, id: hmac(`admin-otp-owner:${email}`), version: hmac(`admin-otp-credentials:${email}:${password}`), hmac }
}
const digest = (token: string) => createHash("sha256").update(token).digest("hex")
const newCode = () => randomInt(0, 100000000).toString().padStart(8, "0")
function codeHash(token: string, code: string) {
  const config = settings()
  return config.hmac(`admin-otp:${config.version}:${token}:${code}`)
}
async function deliver(token: string, code: string, expiresAt: Date) {
  const config = settings(), hash = codeHash(token, code), tokenHash = digest(token)
  try {
    await sendAdminLoginCode(config.email, code, expiresAt)
    const activated = await prisma.adminLoginChallenge.updateMany({ where: { id: config.id, tokenHash, codeHash: hash, consumedAt: null, expiresAt: { gt: new Date() } }, data: { delivered: true } })
    if (activated.count !== 1) throw new Error("Challenge replaced")
  } catch {
    await prisma.adminLoginChallenge.updateMany({ where: { id: config.id, tokenHash, codeHash: hash }, data: { delivered: false, expiresAt: new Date(0) } })
    throw new OtpError("We couldn’t send your code. Please sign in again shortly, or contact the site administrator.", true)
  }
}
export async function startAdminOtp() {
  const config = settings(), now = new Date()
  await consumeLimit("admin-code-send", config.email, 5)
  await prisma.adminLoginChallenge.deleteMany({ where: { expiresAt: { lt: new Date(Date.now() - 86400000) } } })
  // A single account row makes the send cooldown atomic across browsers/processes.
  try {
    await prisma.adminLoginChallenge.upsert({ where: { id: config.id }, create: { id: config.id, tokenHash: "", codeHash: "", credentialVersion: "", expiresAt: new Date(0), lastSentAt: new Date(0) }, update: {} })
  } catch (error) { if ((error as { code?: string }).code !== "P2002") throw error }
  const token = randomBytes(32).toString("hex"), code = newCode(), expiresAt = new Date(now.getTime() + OTP_LIFETIME)
  const claimed = await prisma.adminLoginChallenge.updateMany({ where: { id: config.id, OR: [{ lastSentAt: { lte: new Date(now.getTime() - 60000) } }, { credentialVersion: { not: config.version } }] }, data: { tokenHash: digest(token), codeHash: codeHash(token, code), credentialVersion: config.version, expiresAt, lastSentAt: now, attempts: 0, consumedAt: null, delivered: false } })
  if (claimed.count !== 1) throw new OtpError("Please wait a minute before requesting another code.", true)
  await deliver(token, code, expiresAt)
  return { token, expiresAt }
}
async function pending(token?: string) {
  const config = settings()
  if (!token || !/^[a-f0-9]{64}$/.test(token)) throw new OtpError("Please enter your email and password again.", true)
  const row = await prisma.adminLoginChallenge.findUnique({ where: { id: config.id } })
  if (!row || row.tokenHash !== digest(token) || row.credentialVersion !== config.version || row.consumedAt || row.expiresAt.getTime() <= Date.now() || row.attempts >= 5 || !row.delivered) throw new OtpError("This sign-in code has expired or is no longer valid. Please sign in again.", true)
  return { row, config, token }
}
export async function verifyAdminOtp(token: string | undefined, code: string) {
  const { row, config, token: browserToken } = await pending(token)
  const eligible = { id: config.id, tokenHash: row.tokenHash, codeHash: row.codeHash, credentialVersion: config.version, consumedAt: null, delivered: true, expiresAt: { gt: new Date() }, attempts: { lt: 5 } }
  const attempt = await prisma.adminLoginChallenge.updateMany({ where: eligible, data: { attempts: { increment: 1 } } })
  if (attempt.count !== 1) throw new OtpError("Please sign in again to request a new code.", true)
  const expected = Buffer.from(row.codeHash, "hex"), supplied = Buffer.from(codeHash(browserToken, code), "hex")
  if (!/^\d{8}$/.test(code) || !timingSafeEqual(expected, supplied)) throw new OtpError("That code is incorrect. Please check your email and try again.")
  // Consume atomically: two simultaneous correct submissions cannot both succeed.
  const consumed = await prisma.adminLoginChallenge.updateMany({ where: { ...eligible, attempts: { lte: 5 }, expiresAt: { gt: new Date() } }, data: { consumedAt: new Date() } })
  if (consumed.count !== 1) throw new OtpError("This code was already used or replaced. Please sign in again.", true)
  return config.email
}
export async function resendAdminOtp(token?: string) {
  const { row, config, token: browserToken } = await pending(token)
  if (row.lastSentAt.getTime() > Date.now() - 60000) throw new OtpError("Please wait at least one minute before requesting another code.")
  await consumeLimit("admin-code-send", config.email, 5)
  let code: string
  do { code = newCode() } while (codeHash(browserToken, code) === row.codeHash)
  const changed = await prisma.adminLoginChallenge.updateMany({ where: { id: config.id, tokenHash: row.tokenHash, codeHash: row.codeHash, credentialVersion: config.version, lastSentAt: { lte: new Date(Date.now() - 60000) }, attempts: { lt: 5 }, consumedAt: null, delivered: true, expiresAt: { gt: new Date() } }, data: { codeHash: codeHash(browserToken, code), lastSentAt: new Date(), delivered: false } })
  if (changed.count !== 1) throw new OtpError("Wait at least one minute between codes. If this sign-in expired, start again.")
  await deliver(browserToken, code, row.expiresAt)
}
export async function cancelAdminOtp(token?: string) {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return
  await prisma.adminLoginChallenge.updateMany({ where: { id: settings().id, tokenHash: digest(token) }, data: { consumedAt: new Date() } })
}
