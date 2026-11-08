import mariadb from 'mariadb'
import { readdir, lstat, realpath, unlink } from 'node:fs/promises'
import path from 'node:path'
const remove = process.argv.includes('--delete')
if (remove && (!process.argv.includes('--maintenance-confirmed') || !process.argv.includes('--backup-confirmed'))) throw new Error('Deletion requires stopped application writes and a verified backup. Pass both --maintenance-confirmed and --backup-confirmed.')
const configured = process.env.PRODUCT_IMAGE_DIRECTORY
if (!configured || !path.isAbsolute(configured)) throw new Error('Configure an absolute persistent photo directory.')
const folder = await realpath(configured), root = await realpath(process.cwd())
if (folder === root || folder.startsWith(root + path.sep) || root.startsWith(folder + path.sep)) throw new Error('Use a separate private photo directory.')
const u = new URL(process.env.DATABASE_URL)
if (u.protocol !== 'mysql:' || (u.searchParams.get('sslaccept') && u.searchParams.get('sslaccept') !== 'strict')) throw new Error('Use MySQL with verified TLS when remote.')
const connection = await mariadb.createConnection({ host: u.hostname, port: Number(u.port || 3306), user: decodeURIComponent(u.username), password: decodeURIComponent(u.password), database: decodeURIComponent(u.pathname.slice(1)), ...(u.searchParams.get('sslaccept') === 'strict' ? { ssl: { rejectUnauthorized: true } } : {}) })
try {
  // Fail closed: every reference source must be readable before proposing deletion.
  const sources = await Promise.all([
    connection.query('SELECT url FROM ProductImage'), connection.query('SELECT image FROM Category'),
    connection.query('SELECT draft, published FROM SiteContent'), connection.query('SELECT content FROM ContentRevision'),
  ])
  const references = new Set()
  function inspect(value) {
    if (typeof value === 'string') {
      for (const match of value.matchAll(/\/media\/products\/([0-9a-f-]{36}\.(?:jpg|png|webp|avif))/g)) references.add(match[1])
    } else if (value && typeof value === 'object') { for (const child of Object.values(value)) inspect(child) }
  }
  sources.forEach(inspect)
  let count = 0, bytes = 0
  for (const name of await readdir(folder)) {
    if (!/^[0-9a-f-]{36}\.(jpg|png|webp|avif)$/.test(name) || references.has(name)) continue
    const file = path.join(folder, name), info = await lstat(file)
    if (!info.isFile() || info.mtimeMs > Date.now() - 7 * 86400000) continue
    count++; bytes += info.size
    console.log(`${remove ? 'DELETE' : 'CANDIDATE'} ${name}`)
    if (remove) await unlink(file)
  }
  console.log(JSON.stringify({ mode: remove ? 'delete' : 'report-only', files: count, bytes, retainedReferences: references.size, minimumAgeDays: 7 }))
} finally { await connection.end() }
