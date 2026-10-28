import 'dotenv/config'
import pg from 'pg'
import mariadb from 'mariadb'
import { isDeepStrictEqual } from 'node:util'

// This command never writes to the source. The target must already have the
// MySQL baseline applied and must contain no business records.
const tables = ['Category', 'Product', 'ProductImage', 'Material', 'Stone', 'ProductDetail', 'Review', 'ProductView', 'WhatsAppClick', 'Order', 'Consultation', 'SearchSettings', 'SocialSettings', 'RequestActivity', 'SiteContent', 'ContentRevision']
const jsonFields = { Product: ['metalOptions'], Order: ['items'], SiteContent: ['draft', 'published'], ContentRevision: ['content'] }
const sourceUrl = process.env.SOURCE_DATABASE_URL
const targetUrl = process.env.TARGET_DATABASE_URL
if (!sourceUrl?.startsWith('postgres') || !targetUrl?.startsWith('mysql://')) throw new Error('Set SOURCE_DATABASE_URL (PostgreSQL) and TARGET_DATABASE_URL (MySQL). Do not put credentials in command arguments.')
const copy = process.argv.includes('--copy')
const verify = process.argv.includes('--verify')
if (copy && verify) throw new Error('Use --copy or --verify, not both.')
const source = new pg.Client({ connectionString: sourceUrl })
let target
let sourceOpen = false, targetOpen = false
function mysqlOptions(value) {
  const url = new URL(value)
  if (url.searchParams.get('sslaccept') && url.searchParams.get('sslaccept') !== 'strict') throw new Error('Use verified TLS for remote MySQL connections.')
  return { host: url.hostname, port: Number(url.port || 3306), user: decodeURIComponent(url.username), password: decodeURIComponent(url.password), database: decodeURIComponent(url.pathname.slice(1)), timezone: 'Z', charset: 'utf8mb4', initSql: "SET time_zone = '+00:00'", ...(url.searchParams.get('sslaccept') === 'strict' ? { ssl: { rejectUnauthorized: true } } : {}) }
}
function normalize(row, table) {
  const next = { ...row }
  for (const field of jsonFields[table] || []) if (typeof next[field] === 'string') next[field] = JSON.parse(next[field])
  if (table === 'Product') next.available = Boolean(next.available)
  for (const key of Object.keys(next)) if (next[key] instanceof Date) next[key] = next[key].toISOString()
  return next
}
try {
  await source.connect()
  await source.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
  sourceOpen = true
  target = await mariadb.createConnection(mysqlOptions(targetUrl))
  await target.beginTransaction()
  targetOpen = true
  const snapshots = new Map()
  for (const table of tables) {
    const rows = (await source.query(`SELECT * FROM "${table}" ORDER BY "id"`)).rows
    const count = (await target.query(`SELECT COUNT(*) AS count FROM \`${table}\``))[0].count
    if (!verify && Number(count) !== 0) throw new Error(`Target ${table} is not empty. No data was overwritten.`)
    snapshots.set(table, rows)
    console.log(`${table}: ${rows.length} source records`)
  }
  if (copy || verify) {
    if (copy) for (const [table, rows] of snapshots) {
      for (const row of rows) {
        const columns = Object.keys(row)
        const values = columns.map(column => (jsonFields[table] || []).includes(column) ? JSON.stringify(row[column]) : row[column])
        await target.query(`INSERT INTO \`${table}\` (${columns.map(column => `\`${column}\``).join(',')}) VALUES (${columns.map(() => '?').join(',')})`, values)
      }
    }
    // Compare every field, not just record counts, before committing anything.
    for (const [table, expected] of snapshots) {
      const actual = await target.query(`SELECT * FROM \`${table}\` ORDER BY \`id\``)
      const byId = new Map(actual.map(row => [row.id, normalize(row, table)]))
      if (actual.length !== expected.length || expected.some(row => !isDeepStrictEqual(normalize(row, table), byId.get(row.id)))) throw new Error(`Verification failed for ${table}; target copy rolled back.`)
    }
    if (copy) { await target.commit(); targetOpen = false }
    console.log(copy ? 'Copy committed after every field was verified. PostgreSQL remains unchanged.' : 'Every field matches the PostgreSQL snapshot. Neither database was changed.')
  } else {
    console.log('Dry run only. Re-run with --copy to copy into the empty MySQL target.')
  }
} catch (error) {
  // Avoid printing connection URLs, SQL values, customer records, or raw driver errors.
  console.error(error instanceof Error && /^(Target |Verification |Use verified)/.test(error.message) ? error.message : 'Migration failed; target transaction rolled back. Check connectivity, collation conflicts, and field limits. No source data was changed.')
  process.exitCode = 1
} finally {
  if (targetOpen) await target?.rollback()
  await target?.end()
  if (sourceOpen) await source.query('ROLLBACK')
  await source.end()
}
