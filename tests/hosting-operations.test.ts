// @vitest-environment node
import { afterEach, expect, it } from 'vitest'
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises'
import { promisify } from 'node:util'
import { execFile } from 'node:child_process'
import path from 'node:path'
import os from 'node:os'
const execute = promisify(execFile), roots: string[] = []
const scripts = path.resolve('scripts/hosting')
afterEach(async () => { await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))) })
it('requires maintenance acknowledgement before creating any backup', async () => {
  await expect(execute(process.execPath, [path.join(scripts, 'backup.mjs')], { env: { NODE_ENV: "test" } })).rejects.toThrow('Stop application writes first')
})
it('encrypts a fixture database and images, restores their bytes, and removes staging secrets', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'emana-backup-test-')); roots.push(root)
  const media = path.join(root, 'media'), backups = path.join(root, 'backups'), publicRoot = path.join(root, 'public_html')
  await Promise.all([media, publicRoot].map(dir => mkdir(dir)))
  await writeFile(path.join(media, 'fixture.jpg'), 'photo-fixture')
  const dump = path.join(root, 'dump-fixture')
  await writeFile(dump, '#!/bin/sh\nprintf "%s" "fixture SQL only"\n', { mode: 0o700 })
  const secret = 'separate-test-backup-password-32-characters'
  const env = { ...process.env, DATABASE_URL: 'mysql://fixture:never-print-this@localhost/fixture', PRODUCT_IMAGE_DIRECTORY: media, BACKUP_DIRECTORY: backups, HOSTING_PUBLIC_ROOT: publicRoot, MYSQLDUMP_BIN: dump, BACKUP_ENCRYPTION_PASSWORD: secret }
  const { stdout } = await execute(process.execPath, [path.join(scripts, 'backup.mjs'), '--maintenance-confirmed'], { env })
  expect(stdout).not.toContain('never-print-this')
  const files = await readdir(backups); expect(files).toHaveLength(1); expect(files[0]).toMatch(/\.tar\.gz\.enc$/)
  const archive = path.join(backups, files[0]), decrypted = path.join(root, 'restored.tar.gz')
  await execute('openssl', ['enc', '-d', '-aes-256-cbc', '-pbkdf2', '-iter', '200000', '-pass', 'env:BACKUP_ENCRYPTION_PASSWORD', '-in', archive, '-out', decrypted], { env })
  const restored = path.join(root, 'restored'); await mkdir(restored)
  await execute('tar', ['-xzf', decrypted, '-C', restored])
  expect(await readFile(path.join(restored, 'database.sql'), 'utf8')).toBe('fixture SQL only')
  expect(await readFile(path.join(restored, 'media/fixture.jpg'), 'utf8')).toBe('photo-fixture')
  expect((await readdir(restored))).not.toContain('mysql.cnf')
  // A later failed dump must preserve the completed backup and remove partial staging.
  env.MYSQLDUMP_BIN = path.join(root, 'missing-dump')
  await expect(execute(process.execPath, [path.join(scripts, 'backup.mjs'), '--maintenance-confirmed'], { env })).rejects.toThrow('Backup failed')
  expect(await readdir(backups)).toEqual(files)
})
it('packages standalone runtime assets without environment files and refuses overwrite', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'emana-package-test-')); roots.push(root)
  for (const dir of ['.next/standalone/nested', '.next/static', 'public']) await mkdir(path.join(root, dir), { recursive: true })
  for (const [file, value] of Object.entries({ '.next/standalone/server.js': 'runtime', '.next/standalone/.env': 'secret', '.next/standalone/nested/.env.production': 'secret', '.next/static/chunk.js': 'chunk', 'public/logo.svg': 'logo' })) await writeFile(path.join(root, file), value)
  await execute(process.execPath, [path.join(scripts, 'package.mjs')], { cwd: root })
  expect(await readdir(path.join(root, 'build/orangehost'))).not.toContain('.env')
  expect(await readdir(path.join(root, 'build/orangehost/nested'))).toEqual([])
  expect(await readFile(path.join(root, 'build/orangehost/.next/static/chunk.js'), 'utf8')).toBe('chunk')
  await expect(execute(process.execPath, [path.join(scripts, 'package.mjs')], { cwd: root })).rejects.toThrow('already contains files')
})
