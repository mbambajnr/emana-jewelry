import { expect, it, vi } from "vitest"
import { createHmac, createHash } from "node:crypto"
const mail = vi.hoisted(() => ({ send: vi.fn() }))
vi.mock("@/lib/notifications", () => ({ sendAdminLoginCode: mail.send }))

it.skipIf(process.env.RUN_MYSQL_INTEGRATION !== "1")("enforces the admin email challenge on MySQL without sending real emails", async () => {
  const { prisma } = await import("@/lib/db")
  const { startAdminOtp, verifyAdminOtp, resendAdminOtp } = await import("@/lib/admin-otp")
  const secret = "otp-integration-test-secret-at-least-32-characters"
  const ids: string[] = [], buckets: string[] = [], credentialIds: string[] = []
  const configure = () => {
    const email = `otp-${crypto.randomUUID()}@example.invalid`
    vi.stubEnv("ADMIN_EMAIL", email); vi.stubEnv("ADMIN_PASSWORD_HASH", "test-salt:test-verifier")
    vi.stubEnv("SESSION_SECRET", secret); vi.stubEnv("RESEND_API_KEY", "test-not-real")
    const hmac = (value: string) => createHmac("sha256", secret).update(value).digest("hex")
    const id = hmac(`admin-otp-owner:${email}`); ids.push(id)
    credentialIds.push(createHash("sha256").update(email).digest("hex"))
    for (const offset of [-1, 0, 1]) buckets.push(`admin-code-send:${hmac(`admin-code-send:${email}:${Math.floor(Date.now() / 900000) + offset}`)}`)
    mail.send.mockReset(); mail.send.mockResolvedValue(undefined)
    return id
  }
  try {
    let id = configure()
    const first = await startAdminOtp(), code = mail.send.mock.calls[0][1]
    expect(code).toMatch(/^\d{8}$/)
    expect(mail.send.mock.calls[0][0]).toBe(process.env.ADMIN_EMAIL)
    expect(await prisma.adminLoginChallenge.findUniqueOrThrow({ where: { id } })).toMatchObject({ delivered: true, attempts: 0 })
    const stored = await prisma.adminLoginChallenge.findUniqueOrThrow({ where: { id } })
    expect(stored.codeHash).not.toBe(code); expect(stored.tokenHash).not.toBe(first.token)
    await expect(verifyAdminOtp("a".repeat(64), code)).rejects.toThrow()
    await expect(resendAdminOtp(first.token)).rejects.toThrow(/minute/)
    const race = await Promise.allSettled([verifyAdminOtp(first.token, code), verifyAdminOtp(first.token, code)])
    expect(race.filter(result => result.status === "fulfilled")).toHaveLength(1)
    await expect(verifyAdminOtp(first.token, code)).rejects.toThrow()

    id = configure()
    const limited = await startAdminOtp(), actual = mail.send.mock.calls[0][1]
    const wrong = actual === "00000000" ? "11111111" : "00000000"
    await Promise.all(Array.from({ length: 8 }, () => verifyAdminOtp(limited.token, wrong).catch(() => {})))
    expect((await prisma.adminLoginChallenge.findUniqueOrThrow({ where: { id } })).attempts).toBe(5)
    await expect(verifyAdminOtp(limited.token, actual)).rejects.toThrow()

    id = configure()
    const resend = await startAdminOtp(), previous = mail.send.mock.calls[0][1]
    await prisma.adminLoginChallenge.update({ where: { id }, data: { lastSentAt: new Date(Date.now() - 61000), attempts: 2 } })
    await resendAdminOtp(resend.token)
    const latest = mail.send.mock.calls[1][1]
    expect(latest).not.toBe(previous)
    expect((await prisma.adminLoginChallenge.findUniqueOrThrow({ where: { id } })).attempts).toBe(2)
    await expect(verifyAdminOtp(resend.token, previous)).rejects.toThrow(/incorrect/)
    expect(await verifyAdminOtp(resend.token, latest)).toBe(process.env.ADMIN_EMAIL)

    id = configure()
    const expired = await startAdminOtp()
    await prisma.adminLoginChallenge.update({ where: { id }, data: { expiresAt: new Date(Date.now() - 1000) } })
    await expect(verifyAdminOtp(expired.token, mail.send.mock.calls[0][1])).rejects.toThrow(/expired/)

    configure()
    const changed = await startAdminOtp()
    vi.stubEnv("ADMIN_PASSWORD_HASH", "different-password-verifier")
    await expect(verifyAdminOtp(changed.token, mail.send.mock.calls[0][1])).rejects.toThrow()

    id = configure()
    mail.send.mockRejectedValue(new Error("Provider rejected test"))
    await expect(startAdminOtp()).rejects.toThrow(/couldn’t send/)
    expect((await prisma.adminLoginChallenge.findUniqueOrThrow({ where: { id } })).delivered).toBe(false)
    await expect(verifyAdminOtp("b".repeat(64), "00000000")).rejects.toThrow()
  } finally {
    await prisma.adminLoginChallenge.deleteMany({ where: { id: { in: ids } } })
    await prisma.adminCredential.deleteMany({ where: { id: { in: credentialIds } } })
    await prisma.rateBucket.deleteMany({ where: { key: { in: buckets } } })
    vi.unstubAllEnvs(); await prisma.$disconnect()
  }
})
