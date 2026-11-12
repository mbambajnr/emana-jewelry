import { socketConnectionOptions } from "../../src/lib/mysql-socket.mjs"
import { access, constants, realpath, statfs } from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import mariadb from 'mariadb'

let failed = false
const report = (ok, message) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${message}`); if (!ok) failed = true }
const [major, minor] = process.versions.node.split('.').map(Number)
report(major === 20 ? minor >= 19 : major === 22 ? minor >= 12 : major >= 24, 'Supported Node runtime (20.19+, 22.12+, or 24+)')
for (const name of ['SESSION_SECRET', 'ADMIN_EMAIL', 'ADMIN_PASSWORD_HASH', 'EMAIL_SETTINGS_KEY', 'DATABASE_URL']) report(!!process.env[name], `${name} configured`)
report((process.env.SESSION_SECRET || '').length >= 32, 'Session secret has sufficient length')
report(/^[A-Za-z0-9+/]{43}=$/.test(process.env.EMAIL_SETTINGS_KEY || ''), 'SMTP encryption key is 32-byte base64')
try { const u = new URL(process.env.NEXT_PUBLIC_SITE_URL); report(u.protocol === 'https:' && !['localhost', '127.0.0.1'].includes(u.hostname) && !u.username && !u.password && u.pathname === '/', 'Public site origin uses production HTTPS') } catch { report(false, 'Public site origin uses production HTTPS') }
const mode = process.env.IMAGE_STORAGE || 'filesystem'
report(mode === 'filesystem', 'OrangeHost filesystem image storage selected')
let media
try {
  if (!process.env.PRODUCT_IMAGE_DIRECTORY || !path.isAbsolute(process.env.PRODUCT_IMAGE_DIRECTORY)) throw new Error()
  const root = await realpath(process.cwd()); media = await realpath(process.env.PRODUCT_IMAGE_DIRECTORY)
  const publicRoot = process.env.HOSTING_PUBLIC_ROOT ? await realpath(process.env.HOSTING_PUBLIC_ROOT) : null
  const inside = (parent, child) => child === parent || child.startsWith(parent + path.sep)
  if (inside(root, media) || inside(media, root) || (publicRoot && (inside(publicRoot, media) || inside(media, publicRoot)))) throw new Error()
  await access(media, constants.R_OK | constants.W_OK)
  report(true, 'Persistent image directory readable/writable and outside application/public roots')
  const disk = await statfs(media)
  report(disk.bavail * disk.bsize >= 512 * 1024 * 1024, 'Filesystem reports at least 512 MB free (also check cPanel account quota)')
} catch { report(false, 'Configure an existing writable image directory outside the application and public web root') }
report(!!process.env.HOSTING_PUBLIC_ROOT, 'HOSTING_PUBLIC_ROOT configured so public-path checks can run')
report((process.env.NOTIFICATION_CRON_SECRET || '').length >= 32, 'Notification scheduler secret configured (verify cron execution separately)')
report((process.env.BACKUP_ENCRYPTION_PASSWORD || '').length >= 32, 'Separate backup encryption password configured')
try {
  const configured = process.env.BACKUP_DIRECTORY
  if (!configured || !path.isAbsolute(configured) || !process.env.HOSTING_PUBLIC_ROOT) throw new Error()
  const [backups, app, publicRoot] = await Promise.all([configured, process.cwd(), process.env.HOSTING_PUBLIC_ROOT].map(value => realpath(value)))
  const overlap = (a, b) => a === b || a.startsWith(b + path.sep) || b.startsWith(a + path.sep)
  if (overlap(backups, app) || overlap(backups, publicRoot) || (media && overlap(backups, media))) throw new Error()
  await access(backups, constants.R_OK | constants.W_OK)
  report(true, 'Private backup directory accessible and separate from app, public root and media')
} catch { report(false, 'Configure a private writable backup directory outside app/public/media directories') }
let connection
try {
  const u = new URL(process.env.DATABASE_URL)
  if (u.protocol !== 'mysql:' || (u.searchParams.get('sslaccept') && u.searchParams.get('sslaccept') !== 'strict')) throw new Error()
  const limit = Number(u.searchParams.get('connection_limit') || 3)
  report(Number.isInteger(limit) && limit >= 1 && limit <= 3, 'Database pool limited to 1–3 connections per app process')
  connection = await mariadb.createConnection({ ...socketConnectionOptions(u), host: u.hostname, port: Number(u.port || 3306), user: decodeURIComponent(u.username), password: decodeURIComponent(u.password), database: decodeURIComponent(u.pathname.slice(1)), connectTimeout: 5000, ...(u.searchParams.get('sslaccept') === 'strict' ? { ssl: { rejectUnauthorized: true } } : {}) })
  const version = await connection.query('SELECT VERSION() AS version')
  console.log(`INFO Database server: ${version[0].version}`)
  const migrations = await connection.query('SELECT COUNT(*) AS count FROM _prisma_migrations WHERE finished_at IS NULL AND rolled_back_at IS NULL')
  report(Number(migrations[0].count) === 0, 'No unfinished database migrations (also run prisma migrate status)')
  const images = await connection.query('SELECT url FROM ProductImage')
  let missing = 0
  for (const { url } of images) {
    if (url.startsWith('/media/products/')) {
      const filename = url.slice('/media/products/'.length)
      if (!media || !/^[0-9a-f-]{36}\.(jpg|png|webp|avif)$/.test(filename)) { missing++; continue }
      try { await access(path.join(media, filename), constants.R_OK) } catch { missing++ }
    }
  }
  report(missing === 0, `Uploaded product images readable (${missing} missing or invalid references)`)
  const id = createHash('sha256').update(process.env.ADMIN_EMAIL || '').digest('hex')
  const saved = await connection.query('SELECT id FROM EmailSettings WHERE id=?', [id])
  const emailReady = saved.length > 0 || (process.env.EMAIL_PROVIDER === 'smtp' ? !!process.env.SMTP_PASS : !!process.env.RESEND_API_KEY)
  report(emailReady, 'Email credentials exist (real test delivery still required)')
} catch { report(false, 'Database connection/schema checks failed; verify credentials and applied migrations') }
finally { if (connection) await connection.end() }
console.log('INFO Verify cPanel disk quota, Node process management, HTTPS, cron, real email delivery and a backup restore before launch.')
process.exitCode = failed ? 1 : 0
