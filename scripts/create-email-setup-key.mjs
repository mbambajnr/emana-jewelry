import { createHash, randomBytes } from "node:crypto"
import mariadb from "mariadb"

// Run with node --env-file=.env scripts/create-email-setup-key.mjs.
// The printed key authorizes email configuration only, not an admin session.
const email = process.env.ADMIN_EMAIL, value = process.env.DATABASE_URL
if (!email || !value || !process.env.EMAIL_SETTINGS_KEY) throw new Error("Configure the admin, database, and email encryption key first.")
const url = new URL(value)
if (url.protocol !== "mysql:" || (url.searchParams.get("sslaccept") && url.searchParams.get("sslaccept") !== "strict")) throw new Error("Use a MySQL URL with verified TLS for remote databases.")
const connection = await mariadb.createConnection({ host: url.hostname, port: Number(url.port || 3306), user: decodeURIComponent(url.username), password: decodeURIComponent(url.password), database: url.pathname.slice(1), timezone: "Z", ...(url.searchParams.get("sslaccept") === "strict" ? { ssl: { rejectUnauthorized: true } } : {}) })
const key = randomBytes(32).toString("base64url"), expiresAt = new Date(Date.now() + 30 * 60000)
const ownerId = createHash("sha256").update(email).digest("hex")
try {
  await connection.beginTransaction()
  await connection.query("UPDATE EmailSetupGrant SET consumedAt = ? WHERE ownerId = ? AND consumedAt IS NULL", [new Date(), ownerId])
  await connection.query("INSERT INTO EmailSetupGrant (id, ownerId, tokenHash, expiresAt, attempts) VALUES (?, ?, ?, ?, 0)", [crypto.randomUUID(), ownerId, createHash("sha256").update(key).digest("hex"), expiresAt])
  await connection.commit()
  console.log(`Email setup key: ${key}`)
  console.log(`Expires: ${expiresAt.toISOString()}. Five attempts; single use. Also requires the current admin password.`)
} catch {
  await connection.rollback()
  throw new Error("Could not issue an email setup key. No existing key was changed.")
} finally { await connection.end() }
