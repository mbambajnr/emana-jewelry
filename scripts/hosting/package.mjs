import { cp, readdir, rm, mkdir, stat } from 'node:fs/promises'
import path from 'node:path'
const destination = path.resolve('build/orangehost')
await stat('.next/standalone/server.js').catch(() => { throw new Error('Build first with ORANGEHOST_STANDALONE=1 npm run build. Build on Linux matching the host, not macOS.') })
// Only copy the runtime tree and public assets. No source checkout or operator secrets.
await mkdir(destination, { recursive: true })
if ((await readdir(destination)).length) throw new Error('build/orangehost already contains files. Move the previous artifact before packaging again.')
const filter = source => !path.basename(source).startsWith('.env') && !/^sharp(?:-|$)/.test(path.basename(source))
await cp('.next/standalone', destination, { recursive: true, filter })
await cp('public', path.join(destination, 'public'), { recursive: true })
await cp('.next/static', path.join(destination, '.next/static'), { recursive: true })
// Next can trace .env files; check recursively as well as filtering during copy.
async function check(folder) {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    if (entry.name === 'sharp' || entry.name.startsWith('sharp-')) { await rm(destination, { recursive: true, force: true }); throw new Error('Native Sharp found in runtime artifact; artifact removed.') }
    if (entry.name.startsWith('.env')) { await rm(destination, { recursive: true, force: true }); throw new Error('Environment file found in runtime artifact; artifact removed.') }
    if (entry.isDirectory()) await check(path.join(folder, entry.name))
  }
}
await check(destination)
console.log('Runtime staged at build/orangehost. Upload its contents to the private app root and start server.js with production environment variables.')
console.log('This artifact matches the build OS/CPU. Use a Linux build matching OrangeHost. Keep operator scripts/prisma migrations in a separate private checkout.')
