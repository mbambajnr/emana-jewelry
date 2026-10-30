import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
const source = path.resolve('.data/product-images')
const target = process.env.PRODUCT_IMAGE_DIRECTORY
if (!target || !path.isAbsolute(target) || path.resolve(target).startsWith(process.cwd() + path.sep) || path.resolve(target) === process.cwd()) throw new Error('Set PRODUCT_IMAGE_DIRECTORY to an absolute persistent path outside the app checkout.')
const copy = process.argv.includes('--copy')
const files = (await readdir(source)).filter(file => /^[0-9a-f-]{36}\.(jpg|png|webp|avif)$/.test(file))
if (copy) await mkdir(target, { recursive: true, mode: 0o700 })
let existing = 0, copied = 0
for (const file of files) {
  const buffer = await readFile(path.join(source, file))
  let current
  try { current = await readFile(path.join(target, file)) } catch (error) { if (error.code !== 'ENOENT') throw error }
  if (current) {
    if (createHash('sha256').update(current).digest('hex') !== createHash('sha256').update(buffer).digest('hex')) throw new Error('A target file differs from the source. Nothing will be overwritten.')
    existing++
  } else if (copy) {
    await writeFile(path.join(target, file), buffer, { flag: 'wx', mode: 0o600 })
    const verified = await readFile(path.join(target, file))
    if (!buffer.equals(verified)) throw new Error('A copied image failed verification.')
    copied++
  }
}
console.log(JSON.stringify({ sourceImages: files.length, alreadyVerified: existing, copied, mode: copy ? 'copy' : 'dry-run', originalFilesRetained: true, urlsUnchanged: true }))
