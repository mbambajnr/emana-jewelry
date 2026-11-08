// @vitest-environment node
import { expect, it } from "vitest"
import { mkdtemp, writeFile, utimes, readdir, rm } from "node:fs/promises"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import path from "node:path"
import os from "node:os"
it.skipIf(process.env.RUN_MYSQL_INTEGRATION !== "1")("cleans only old unreferenced fixture photos and retains CMS revision references", async () => {
  const { prisma } = await import("@/lib/db")
  const folder = await mkdtemp(path.join(os.tmpdir(), "emana-cleanup-test-")), execute = promisify(execFile)
  const unused = `${crypto.randomUUID()}.webp`, referenced = `${crypto.randomUUID()}.webp`, recent = `${crypto.randomUUID()}.webp`, id = crypto.randomUUID()
  try {
    const old = new Date(Date.now() - 8 * 86400000)
    for (const name of [unused, referenced, recent]) { await writeFile(path.join(folder, name), "fixture"); if (name !== recent) await utimes(path.join(folder, name), old, old) }
    await prisma.contentRevision.create({ data: { id, content: { image: `/media/products/${referenced}` }, action: "test", actor: "fixture@example.invalid" } })
    const script = path.resolve("scripts/hosting/unused-images.mjs"), env = { ...process.env, PRODUCT_IMAGE_DIRECTORY: folder }
    const { stdout } = await execute(process.execPath, [script], { env })
    expect(stdout).toContain(unused); expect(stdout).not.toContain(referenced); expect(stdout).not.toContain(recent)
    expect(await readdir(folder)).toHaveLength(3)
    await expect(execute(process.execPath, [script, "--delete"], { env })).rejects.toThrow("requires stopped application writes")
    await execute(process.execPath, [script, "--delete", "--maintenance-confirmed", "--backup-confirmed"], { env })
    expect((await readdir(folder)).sort()).toEqual([referenced, recent].sort())
  } finally {
    await prisma.contentRevision.deleteMany({ where: { id } })
    await rm(folder, { recursive: true, force: true }); await prisma.$disconnect()
  }
})
