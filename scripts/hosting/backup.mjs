import { spawn } from 'node:child_process'
import { pipeline } from 'node:stream/promises'
import { mkdir, mkdtemp, realpath, writeFile, rm, chmod } from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import path from 'node:path'

// Run only while application writes are stopped. Never print database credentials.
if (!process.argv.includes('--maintenance-confirmed')) throw new Error('Stop application writes first, then pass --maintenance-confirmed. See docs/ORANGEHOST.md.')
if (!process.env.BACKUP_ENCRYPTION_PASSWORD || process.env.BACKUP_ENCRYPTION_PASSWORD.length < 32) throw new Error('Set a separate BACKUP_ENCRYPTION_PASSWORD of at least 32 characters.')
const target = process.env.BACKUP_DIRECTORY, mediaPath = process.env.PRODUCT_IMAGE_DIRECTORY, publicPath = process.env.HOSTING_PUBLIC_ROOT
if (![target, mediaPath, publicPath].every(value => value && path.isAbsolute(value))) throw new Error('Set absolute BACKUP_DIRECTORY, PRODUCT_IMAGE_DIRECTORY and HOSTING_PUBLIC_ROOT paths.')
await mkdir(target, { recursive: true, mode: 0o700 })
const [root, output, media, publicRoot] = await Promise.all([process.cwd(), target, mediaPath, publicPath].map(value => realpath(value)))
const within = (parent, child) => child === parent || child.startsWith(parent + path.sep)
if (within(root, output) || within(output, root) || within(publicRoot, output) || within(output, publicRoot) || within(media, output) || within(root, media) || within(media, root) || within(publicRoot, media) || within(media, publicRoot) || within(output, media)) throw new Error('Images and backups must be separate directories outside the application and public web root.')
const u = new URL(process.env.DATABASE_URL)
if (u.protocol !== 'mysql:' || !['localhost', '127.0.0.1', '::1'].includes(u.hostname)) throw new Error('This OrangeHost backup command supports a local MySQL server only. Use a verified-TLS backup tool for remote databases.')
const quote = value => '"' + value.replaceAll('\\', '\\\\').replaceAll('"', '\\"').replaceAll('\n', '\\n').replaceAll('\r', '\\r') + '"'
const stage = await mkdtemp(path.join(output, '.staging-'))
await chmod(stage, 0o700)
const destination = path.join(output, `emana-${new Date().toISOString().replaceAll(':', '-')}-${crypto.randomUUID().slice(0, 8)}.tar.gz.enc`)
const run = (command, args, options = {}) => {
  const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], ...options })
  // Do not surface stderr: database clients may echo private connection information.
  child.stderr?.resume()
  const done = new Promise((resolve, reject) => { child.on('error', () => reject(new Error(`${command} could not start`))); child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${command} failed`))) })
  done.catch(() => {})
  return { child, done }
}
try {
  const config = path.join(stage, 'mysql.cnf')
  await writeFile(config, `[client]\nhost=${quote(u.hostname)}\nport=${Number(u.port || 3306)}\nuser=${quote(decodeURIComponent(u.username))}\npassword=${quote(decodeURIComponent(u.password))}\n`, { mode: 0o600 })
  const dump = run(process.env.MYSQLDUMP_BIN || 'mysqldump', [`--defaults-extra-file=${config}`, '--single-transaction', '--quick', '--skip-lock-tables', '--no-tablespaces', '--hex-blob', '--default-character-set=utf8mb4', '--', decodeURIComponent(u.pathname.slice(1))])
  await Promise.all([pipeline(dump.child.stdout, createWriteStream(path.join(stage, 'database.sql'), { mode: 0o600, flags: 'wx' })), dump.done])
  await rm(config)
  await writeFile(path.join(stage, 'manifest.json'), JSON.stringify({ format: 1, createdAt: new Date().toISOString(), database: 'database.sql', images: path.basename(media) + "/", applicationWritesStopped: true, secrets: 'Restore requires original EMAIL_SETTINGS_KEY and server environment from separate secure escrow.' }, null, 2), { mode: 0o600 })
  const tar = run('tar', ['-czf', '-', '-C', stage, 'database.sql', 'manifest.json', '-C', path.dirname(media), path.basename(media)])
  const encrypted = run('openssl', ['enc', '-aes-256-cbc', '-salt', '-pbkdf2', '-iter', '200000', '-pass', 'env:BACKUP_ENCRYPTION_PASSWORD'], { stdio: ['pipe', 'pipe', 'pipe'] })
  await Promise.all([pipeline(tar.child.stdout, encrypted.child.stdin), pipeline(encrypted.child.stdout, createWriteStream(destination, { mode: 0o600, flags: 'wx' })), tar.done, encrypted.done])
  console.log(`Encrypted backup created: ${destination}`)
  console.log('Copy off-host; verify decryption and an isolated restore. Keep EMAIL_SETTINGS_KEY and environment secrets separately. No old backups were deleted.')
} catch {
  await rm(destination, { force: true })
  throw new Error('Backup failed. Partial archive removed; no existing backup was changed.')
} finally { await rm(stage, { recursive: true, force: true }) }
