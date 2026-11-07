import "server-only"
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto"
import { prisma } from "./db"
import { consumeLimit } from "./request-safety"
import { sendAdminLoginCode } from "./notifications"
import { readAdminPasswordHash } from "./admin-credentials"
import { assertEmailConfigured } from "./mail-config"
import type { Prisma } from "@/generated/prisma/client"
export type OtpPurpose = "login" | "password-change" | "password-reset"

export const OTP_LIFETIME = 10 * 60 * 1000
export class OtpError extends Error {
  constructor(message: string, public restart = false) { super(message) }
}
async function settings(purpose: OtpPurpose = "login") {
  const { ADMIN_EMAIL: email, SESSION_SECRET: secret } = process.env
  if (!email || !process.env.ADMIN_PASSWORD_HASH || !secret || secret.length < 32) throw new OtpError("Admin email verification is unavailable. Contact the site administrator.", true)
  try { assertEmailConfigured() } catch { throw new OtpError("Admin email verification is unavailable. Contact the site administrator.", true) }
  const password = await readAdminPasswordHash()
  const suffix = purpose === "login" ? "" : `:${purpose}`
  const hmac = (value: string) => createHmac("sha256", secret).update(value).digest("hex")
  return { email, password, purpose, id: hmac(`admin-otp-owner:${email}${suffix}`), version: hmac(`admin-otp-credentials:${email}:${password}${suffix}`), hmac }
}
const digest = (token: string) => createHash("sha256").update(token).digest("hex")
const newCode = () => randomInt(0, 100000000).toString().padStart(8, "0")
function codeHash(config: Awaited<ReturnType<typeof settings>>, token: string, code: string) {
  return config.hmac(`admin-otp:${config.version}:${token}:${code}`)
}
async function deliver(token: string, code: string, expiresAt: Date, purpose: OtpPurpose) {
  const config = await settings(purpose), hash = codeHash(config, token, code), tokenHash = digest(token)
  try {
    await sendAdminLoginCode(config.email, code, expiresAt, purpose)
    const activated = await prisma.adminLoginChallenge.updateMany({ where: { id: config.id, tokenHash, codeHash: hash, consumedAt: null, expiresAt: { gt: new Date() } }, data: { delivered: true } })
    if (activated.count !== 1) throw new Error("Challenge replaced")
  } catch {
    await prisma.adminLoginChallenge.updateMany({ where: { id: config.id, tokenHash, codeHash: hash }, data: { delivered: false, expiresAt: new Date(0) } })
    throw new OtpError("We couldn’t send your code. Please sign in again shortly, or contact the site administrator.", true)
  }
}
export async function startAdminOtp(purpose: OtpPurpose = "login", pendingPasswordHash?: string, expectedPasswordHash?: string, browserToken?: string) {
  const config = await settings(purpose), now = new Date()
  if (expectedPasswordHash && config.password !== expectedPasswordHash) throw new OtpError("Your credentials changed. Sign in again.", true)
  await consumeLimit("admin-code-send", config.email, 5)
  await prisma.adminLoginChallenge.deleteMany({ where: { expiresAt: { lt: new Date(Date.now() - 86400000) } } })
  // A single account row makes the send cooldown atomic across browsers/processes.
  try {
    await prisma.adminLoginChallenge.upsert({ where: { id: config.id }, create: { id: config.id, tokenHash: "", codeHash: "", credentialVersion: "", expiresAt: new Date(0), lastSentAt: new Date(0) }, update: {} })
  } catch (error) { if ((error as { code?: string }).code !== "P2002") throw error }
  if (browserToken && !/^[a-f0-9]{64}$/.test(browserToken)) throw new OtpError("Please start again.", true)
  const token = browserToken || randomBytes(32).toString("hex"), code = newCode(), expiresAt = new Date(now.getTime() + OTP_LIFETIME)
  const claimed = await prisma.adminLoginChallenge.updateMany({ where: { id: config.id, OR: [{ lastSentAt: { lte: new Date(now.getTime() - 60000) } }, { credentialVersion: { not: config.version } }] }, data: { tokenHash: digest(token), codeHash: codeHash(config, token, code), credentialVersion: config.version, expiresAt, lastSentAt: now, attempts: 0, consumedAt: null, delivered: false, pendingPasswordHash: pendingPasswordHash || null } })
  if (claimed.count !== 1) throw new OtpError("Please wait a minute before requesting another code.", true)
  await deliver(token, code, expiresAt, purpose)
  return { token, expiresAt }
}
async function pending(token: string | undefined, purpose: OtpPurpose) {
  const config = await settings(purpose)
  if (!token || !/^[a-f0-9]{64}$/.test(token)) throw new OtpError("Please enter your email and password again.", true)
  const row = await prisma.adminLoginChallenge.findUnique({ where: { id: config.id } })
  if (!row || row.tokenHash !== digest(token) || row.credentialVersion !== config.version || row.consumedAt || row.expiresAt.getTime() <= Date.now() || row.attempts >= 5 || !row.delivered) throw new OtpError("This sign-in code has expired or is no longer valid. Please sign in again.", true)
  return { row, config, token }
}
export async function verifyAdminOtp(token: string | undefined, code: string, purpose: OtpPurpose = "login", commit?: (tx: Prisma.TransactionClient, pendingHash: string | null, verifiedHash: string) => Promise<void>) {
  const { row, config, token: browserToken } = await pending(token, purpose)
  const eligible = { id: config.id, tokenHash: row.tokenHash, codeHash: row.codeHash, credentialVersion: config.version, consumedAt: null, delivered: true, expiresAt: { gt: new Date() }, attempts: { lt: 5 } }
  const attempt = await prisma.adminLoginChallenge.updateMany({ where: eligible, data: { attempts: { increment: 1 } } })
  if (attempt.count !== 1) throw new OtpError("Please sign in again to request a new code.", true)
  const expected = Buffer.from(row.codeHash, "hex"), supplied = Buffer.from(codeHash(config, browserToken, code), "hex")
  if (!/^\d{8}$/.test(code) || !timingSafeEqual(expected, supplied)) throw new OtpError("That code is incorrect. Please check your email and try again.")
  // Consume atomically: two simultaneous correct submissions cannot both succeed.
  await prisma.$transaction(async tx => {
    const consumed = await tx.adminLoginChallenge.updateMany({ where: { ...eligible, attempts: { lte: 5 }, expiresAt: { gt: new Date() } }, data: { consumedAt: new Date(), pendingPasswordHash: null } })
    if (consumed.count !== 1) throw new OtpError("This code was already used or replaced. Please start again.", true)
    if (commit) await commit(tx, row.pendingPasswordHash, config.password)
  })
  return config.email
}
export async function resendAdminOtp(token?: string, purpose: OtpPurpose = "login") {
  const { row, config, token: browserToken } = await pending(token, purpose)
  if (row.lastSentAt.getTime() > Date.now() - 60000) throw new OtpError("Please wait at least one minute before requesting another code.")
  await consumeLimit("admin-code-send", config.email, 5)
  let code: string
  do { code = newCode() } while (codeHash(config, browserToken, code) === row.codeHash)
  const changed = await prisma.adminLoginChallenge.updateMany({ where: { id: config.id, tokenHash: row.tokenHash, codeHash: row.codeHash, credentialVersion: config.version, lastSentAt: { lte: new Date(Date.now() - 60000) }, attempts: { lt: 5 }, consumedAt: null, delivered: true, expiresAt: { gt: new Date() } }, data: { codeHash: codeHash(config, browserToken, code), lastSentAt: new Date(), delivered: false } })
  if (changed.count !== 1) throw new OtpError("Wait at least one minute between codes. If this sign-in expired, start again.")
  await deliver(browserToken, code, row.expiresAt, purpose)
}
export async function cancelAdminOtp(token?: string, purpose: OtpPurpose = "login") {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return
  await prisma.adminLoginChallenge.updateMany({ where: { id: (await settings(purpose)).id, tokenHash: digest(token) }, data: { consumedAt: new Date(), pendingPasswordHash: null } })
}
