import "server-only"
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto"
import { prisma } from "./db"
import { credentialIdentity, readAdminCredential } from "./admin-credentials"
import { verifyPassword } from "./password-crypto"
import { assertEmailConfigured, emailProvider, smtpSettings, type SmtpValues } from "./mail-config"
import { RequestError } from "./request-safety"

function encryptionKey() {
  const raw = process.env.EMAIL_SETTINGS_KEY || ""
  if (!/^[A-Za-z0-9+/]{43}=$/.test(raw)) throw new Error("Email settings encryption is not configured")
  const key = Buffer.from(raw, "base64")
  if (key.length !== 32) throw new Error("Email settings encryption is not configured")
  return key
}
export function encryptSmtpPassword(password: string, ownerId: string) {
  const iv = randomBytes(12), cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv)
  cipher.setAAD(Buffer.from(`email-settings-v1:${ownerId}`))
  const data = Buffer.concat([cipher.update(password, "utf8"), cipher.final()])
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), data.toString("base64url")].join(".")
}
export function decryptSmtpPassword(value: string, ownerId: string) {
  const [version, iv, tag, data, extra] = value.split(".")
  if (version !== "v1" || !iv || !tag || !data || extra !== undefined) throw new Error("Saved email password could not be read")
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(iv, "base64url"))
  decipher.setAAD(Buffer.from(`email-settings-v1:${ownerId}`)); decipher.setAuthTag(Buffer.from(tag, "base64url"))
  return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8")
}
export async function activeEmailConfig() {
  const { id } = credentialIdentity()
  const row = await prisma.emailSettings.findUnique({ where: { id } })
  if (row) return { provider: "smtp" as const, smtp: smtpSettings({ host: row.host, port: row.port, secure: row.secure, user: row.username, from: row.sender, password: decryptSmtpPassword(row.passwordEncrypted, id) }) }
  assertEmailConfigured()
  return emailProvider() === "smtp" ? { provider: "smtp" as const, smtp: smtpSettings() } : { provider: "resend" as const, apiKey: process.env.RESEND_API_KEY! }
}
export async function publicEmailSettings() {
  const row = await prisma.emailSettings.findUnique({ where: { id: credentialIdentity().id } })
  return row ? { host: row.host, port: row.port, username: row.username, sender: row.sender, version: row.version, passwordSet: true, source: "database" } : { host: process.env.SMTP_HOST || "smtp.gmail.com", port: Number(process.env.SMTP_PORT || 465), username: process.env.SMTP_USER || "", sender: process.env.SMTP_FROM || "", version: 0, passwordSet: !!process.env.SMTP_PASS, source: "environment" }
}
export async function authorizeEmailSettings(password: unknown, setupKey?: unknown) {
  if (typeof password !== "string" || !password || password.length > 1024) throw new RequestError("Enter your current admin password.", 403)
  const owner = credentialIdentity()
  let grantId: string | undefined
  if (setupKey !== undefined) {
    if (typeof setupKey !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(setupKey)) throw new RequestError("The setup key or current password is invalid or expired.", 403)
    const tokenHash = createHash("sha256").update(setupKey).digest("hex")
    const grant = await prisma.emailSetupGrant.findUnique({ where: { tokenHash } })
    if (!grant || grant.ownerId !== owner.id) throw new RequestError("The setup key or current password is invalid or expired.", 403)
    const claimed = await prisma.emailSetupGrant.updateMany({ where: { id: grant.id, consumedAt: null, expiresAt: { gt: new Date() }, attempts: { lt: 5 } }, data: { attempts: { increment: 1 } } })
    if (claimed.count !== 1) throw new RequestError("The setup key or current password is invalid or expired.", 403)
    grantId = grant.id
  }
  const credential = await readAdminCredential()
  if (!await verifyPassword(password, credential.passwordHash)) throw new RequestError(setupKey === undefined ? "Your current admin password is incorrect." : "The setup key or current password is invalid or expired.", 403)
  return { credential, grantId }
}
export async function prepareEmailSettings(body: Record<string, unknown>) {
  if (body.host !== "smtp.gmail.com" || (body.port !== 465 && body.port !== 587)) throw new RequestError("This settings page supports Gmail SMTP on port 465 or 587.")
  if (typeof body.username !== "string" || body.username.length > 254 || !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(body.username)) throw new RequestError("Enter the Gmail or Google Workspace sending address.")
  if (typeof body.sender !== "string" || body.sender.length > 320) throw new RequestError("Enter a sender name and email address.")
  if (body.password !== undefined && (typeof body.password !== "string" || body.password.length > 8192)) throw new RequestError("Enter a valid app password.")
  if (!Number.isInteger(body.version) || Number(body.version) < 0) throw new RequestError("Reload email settings before saving.", 409)
  const owner = credentialIdentity(), row = await prisma.emailSettings.findUnique({ where: { id: owner.id } })
  if ((row?.version || 0) !== body.version) throw new RequestError("Email settings changed in another tab. Reload before saving.", 409)
  let password = typeof body.password === "string" ? body.password.replace(/\s/g, "") : ""
  if (!password) {
    if (row && row.host === body.host && row.username === body.username && row.port === body.port) password = decryptSmtpPassword(row.passwordEncrypted, owner.id)
    else if (!row && process.env.SMTP_HOST === body.host && process.env.SMTP_USER === body.username && Number(process.env.SMTP_PORT || 465) === body.port) password = process.env.SMTP_PASS?.replace(/\s/g, "") || ""
  }
  if (!password) throw new RequestError("Enter the Google app password. An account or server change requires a new password.")
  const values: SmtpValues = { host: body.host, port: body.port, secure: body.port === 465, user: body.username, from: body.sender || body.username, password }
  // Protect the database secret before performing any network operations.
  const passwordEncrypted = encryptSmtpPassword(password, owner.id)
  return { config: smtpSettings(values), record: { id: owner.id, host: values.host, port: values.port, secure: values.secure, username: values.user, sender: values.from, passwordEncrypted }, version: Number(body.version) }
}
export async function commitEmailSettings(prepared: Awaited<ReturnType<typeof prepareEmailSettings>>, authorization: Awaited<ReturnType<typeof authorizeEmailSettings>>) {
  await prisma.$transaction(async tx => {
    // Lock the credential row so a concurrent password change cannot authorize a stale save.
    const credential = await tx.adminCredential.updateMany({ where: { id: authorization.credential.id, passwordHash: authorization.credential.passwordHash, bootstrapVersion: authorization.credential.bootstrapVersion }, data: { passwordHash: authorization.credential.passwordHash } })
    if (credential.count !== 1) throw new RequestError("Your credentials changed. Sign in again.", 403)
    if (authorization.grantId) {
      const grant = await tx.emailSetupGrant.updateMany({ where: { id: authorization.grantId, ownerId: prepared.record.id, consumedAt: null, attempts: { lte: 5 }, expiresAt: { gt: new Date() } }, data: { consumedAt: new Date() } })
      if (grant.count !== 1) throw new RequestError("This setup key was already used or expired.", 403)
    }
    if (!prepared.version) await tx.emailSettings.create({ data: prepared.record })
    else {
      const updated = await tx.emailSettings.updateMany({ where: { id: prepared.record.id, version: prepared.version }, data: { ...prepared.record, version: { increment: 1 } } })
      if (updated.count !== 1) throw new RequestError("Email settings changed in another tab. Reload before saving.", 409)
    }
  })
}
