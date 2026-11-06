import "server-only"
import { createHash } from "node:crypto"
import { prisma } from "./db"

export function credentialIdentity() {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD_HASH) throw new Error("Admin credentials are not configured")
  return {
    id: createHash("sha256").update(process.env.ADMIN_EMAIL).digest("hex"),
    bootstrapVersion: createHash("sha256").update(process.env.ADMIN_PASSWORD_HASH).digest("hex"),
  }
}
export async function readAdminCredential() {
  const identity = credentialIdentity(), bootstrap = process.env.ADMIN_PASSWORD_HASH!
  let row
  try {
    row = await prisma.adminCredential.upsert({ where: { id: identity.id }, create: { ...identity, passwordHash: bootstrap }, update: {} })
  } catch (error) {
    if ((error as { code?: string }).code !== "P2002") throw error
    row = await prisma.adminCredential.findUniqueOrThrow({ where: { id: identity.id } })
  }
  // A deliberately changed server-side bootstrap hash remains an operator recovery path.
  if (row.bootstrapVersion !== identity.bootstrapVersion) {
    await prisma.adminCredential.updateMany({ where: { id: row.id, bootstrapVersion: row.bootstrapVersion }, data: { passwordHash: bootstrap, bootstrapVersion: identity.bootstrapVersion } })
    row = await prisma.adminCredential.findUniqueOrThrow({ where: { id: identity.id } })
  }
  return row
}
export async function readAdminPasswordHash() { return (await readAdminCredential()).passwordHash }
