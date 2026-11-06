import { expect, it, vi } from "vitest"
import { createHmac } from "node:crypto"
const mail = vi.hoisted(() => ({ send: vi.fn() }))
vi.mock("@/lib/notifications", () => ({ sendAdminLoginCode: mail.send }))

it.skipIf(process.env.RUN_MYSQL_INTEGRATION !== "1")("persists confirmed password changes, separates OTP purposes, and revokes old access on MySQL", async () => {
  const { prisma } = await import("@/lib/db")
  const { readAdminPasswordHash, credentialIdentity } = await import("@/lib/admin-credentials")
  const { hashPassword, verifyPassword } = await import("@/lib/password-crypto")
  const { beginPasswordChange, completePasswordChange } = await import("@/lib/admin-password-change")
  const { startAdminOtp, verifyAdminOtp } = await import("@/lib/admin-otp")
  const { issueAdminToken, readAdminToken } = await import("@/lib/session-token")
  const email = `password-${crypto.randomUUID()}@example.invalid`, secret = "password-change-integration-secret-with-32-characters"
  const current = "Original test password 123!", next = "A different test password 456!", final = "Final test password 789!"
  const bootstrap = await hashPassword(current)
  vi.stubEnv("ADMIN_EMAIL", email); vi.stubEnv("ADMIN_PASSWORD_HASH", bootstrap); vi.stubEnv("SESSION_SECRET", secret); vi.stubEnv("RESEND_API_KEY", "test-not-real")
  const identity = credentialIdentity(), hmac = (value: string) => createHmac("sha256", secret).update(value).digest("hex")
  const ids = [hmac(`admin-otp-owner:${email}`), hmac(`admin-otp-owner:${email}:password-change`)]
  const buckets = [-1, 0, 1].map(offset => `admin-code-send:${hmac(`admin-code-send:${email}:${Math.floor(Date.now() / 900000) + offset}`)}`)
  mail.send.mockResolvedValue(undefined)
  try {
    expect(await readAdminPasswordHash()).toBe(bootstrap)
    await expect(beginPasswordChange("wrong", next, next)).rejects.toThrow(/current password/)
    await expect(beginPasswordChange(current, "short", "short")).rejects.toThrow(/12/)
    await expect(beginPasswordChange(current, next, "mismatched")).rejects.toThrow(/match/)
    expect(mail.send).not.toHaveBeenCalled()
    const oldSession = await issueAdminToken(email, Date.now() + 600000, bootstrap)
    const login = await startAdminOtp(), loginCode = mail.send.mock.calls.at(-1)![1]
    const change = await beginPasswordChange(current, next, next), changeCode = mail.send.mock.calls.at(-1)![1]
    expect(mail.send.mock.calls.at(-1)![3]).toBe("password-change")
    expect(await readAdminPasswordHash()).toBe(bootstrap)
    const pending = await prisma.adminLoginChallenge.findUniqueOrThrow({ where: { id: ids[1] } })
    expect(pending.pendingPasswordHash).not.toBe(next)
    expect(await verifyPassword(next, pending.pendingPasswordHash!)).toBe(true)
    await expect(completePasswordChange(login.token, loginCode)).rejects.toThrow()
    await expect(verifyAdminOtp(change.token, changeCode)).rejects.toThrow()
    const wrong = changeCode === "00000000" ? "11111111" : "00000000"
    await expect(completePasswordChange(change.token, wrong)).rejects.toThrow(/incorrect/)
    expect(await readAdminPasswordHash()).toBe(bootstrap)
    await completePasswordChange(change.token, changeCode)
    const savedHash = await readAdminPasswordHash()
    expect(savedHash).not.toBe(bootstrap)
    expect(process.env.ADMIN_PASSWORD_HASH).toBe(bootstrap)
    expect(await verifyPassword(next, savedHash)).toBe(true)
    expect(await verifyPassword(current, savedHash)).toBe(false)
    expect(await readAdminToken(oldSession, savedHash)).toBeNull()
    await expect(verifyAdminOtp(login.token, loginCode)).rejects.toThrow()
    await expect(completePasswordChange(change.token, changeCode)).rejects.toThrow()
    expect((await prisma.adminLoginChallenge.findUniqueOrThrow({ where: { id: ids[1] } })).pendingPasswordHash).toBeNull()
    // A fresh read must keep the changed password while the bootstrap env remains unchanged.
    expect((await prisma.adminCredential.findUniqueOrThrow({ where: { id: identity.id } })).passwordHash).toBe(await readAdminPasswordHash())

    const second = await beginPasswordChange(next, final, final), finalCode = mail.send.mock.calls.at(-1)![1]
    const race = await Promise.allSettled([completePasswordChange(second.token, finalCode), completePasswordChange(second.token, finalCode)])
    expect(race.filter(result => result.status === "fulfilled")).toHaveLength(1)
    expect(await verifyPassword(final, await readAdminPasswordHash())).toBe(true)

    await prisma.adminLoginChallenge.update({ where: { id: ids[1] }, data: { lastSentAt: new Date(Date.now() - 61000) } })
    mail.send.mockRejectedValue(new Error("Test delivery failure"))
    await expect(beginPasswordChange(final, next, next)).rejects.toThrow(/couldn’t send/)
    expect(await verifyPassword(final, await readAdminPasswordHash())).toBe(true)

    const recovery = await hashPassword("Operator recovery password!")
    vi.stubEnv("ADMIN_PASSWORD_HASH", recovery)
    expect(await readAdminPasswordHash()).toBe(recovery)
  } finally {
    await prisma.adminLoginChallenge.deleteMany({ where: { id: { in: ids } } })
    await prisma.adminCredential.deleteMany({ where: { id: identity.id } })
    await prisma.rateBucket.deleteMany({ where: { key: { in: buckets } } })
    vi.unstubAllEnvs(); await prisma.$disconnect()
  }
})
