import { expect, it, vi } from "vitest"
import { createHmac } from "node:crypto"
const mail = vi.hoisted(() => ({ send: vi.fn() }))
vi.mock("@/lib/notifications", () => ({ sendAdminLoginCode: mail.send }))

it.skipIf(process.env.RUN_MYSQL_INTEGRATION !== "1")("resets a forgotten password only with the reset-specific email code and revokes old access", async () => {
  const { prisma } = await import("@/lib/db")
  const { hashPassword, verifyPassword } = await import("@/lib/password-crypto")
  const { readAdminPasswordHash, credentialIdentity } = await import("@/lib/admin-credentials")
  const { completePasswordReset } = await import("@/lib/admin-password-reset")
  const { startAdminOtp, verifyAdminOtp } = await import("@/lib/admin-otp")
  const { issueAdminToken, readAdminToken } = await import("@/lib/session-token")
  const email = `reset-${crypto.randomUUID()}@example.invalid`, secret = "reset-integration-secret-at-least-32-characters"
  const bootstrap = await hashPassword("Original test password!"), next = "Recovered new test password!"
  vi.stubEnv("ADMIN_EMAIL", email); vi.stubEnv("ADMIN_PASSWORD_HASH", bootstrap); vi.stubEnv("SESSION_SECRET", secret); vi.stubEnv("RESEND_API_KEY", "test-not-real"); vi.stubEnv("EMAIL_PROVIDER", "resend")
  const identity = credentialIdentity(), hmac = (value: string) => createHmac("sha256", secret).update(value).digest("hex")
  const ids = [hmac(`admin-otp-owner:${email}`), hmac(`admin-otp-owner:${email}:password-reset`)]
  const buckets = [-1, 0, 1].map(offset => `admin-code-send:${hmac(`admin-code-send:${email}:${Math.floor(Date.now() / 900000) + offset}`)}`)
  mail.send.mockResolvedValue(undefined)
  try {
    await readAdminPasswordHash()
    const oldSession = await issueAdminToken(email, Date.now() + 600000, bootstrap)
    const login = await startAdminOtp(), loginCode = mail.send.mock.calls.at(-1)![1]
    const reset = await startAdminOtp("password-reset"), resetCode = mail.send.mock.calls.at(-1)![1]
    expect(mail.send.mock.calls.at(-1)![3]).toBe("password-reset")
    expect(await readAdminPasswordHash()).toBe(bootstrap)
    expect(await readAdminToken(oldSession, await readAdminPasswordHash())).not.toBeNull()
    await expect(completePasswordReset(login.token, loginCode, next, next)).rejects.toThrow()
    await expect(verifyAdminOtp(reset.token, resetCode)).rejects.toThrow()
    await expect(completePasswordReset(reset.token, resetCode, "short", "short")).rejects.toThrow(/12/)
    expect(await readAdminPasswordHash()).toBe(bootstrap)
    const wrong = resetCode === "00000000" ? "11111111" : "00000000"
    await expect(completePasswordReset(reset.token, wrong, next, next)).rejects.toThrow()
    expect(await readAdminPasswordHash()).toBe(bootstrap)
    const attempts = await Promise.allSettled([completePasswordReset(reset.token, resetCode, next, next), completePasswordReset(reset.token, resetCode, next, next)])
    expect(attempts.filter(result => result.status === "fulfilled")).toHaveLength(1)
    const activeHash = await readAdminPasswordHash()
    expect(await verifyPassword(next, activeHash)).toBe(true)
    expect(await verifyPassword("Original test password!", activeHash)).toBe(false)
    expect(await readAdminToken(oldSession, activeHash)).toBeNull()
    await expect(verifyAdminOtp(login.token, loginCode)).rejects.toThrow()
    await expect(completePasswordReset(reset.token, resetCode, next, next)).rejects.toThrow()
    expect(process.env.ADMIN_PASSWORD_HASH).toBe(bootstrap)
  } finally {
    await prisma.adminLoginChallenge.deleteMany({ where: { id: { in: ids } } })
    await prisma.adminCredential.deleteMany({ where: { id: identity.id } })
    await prisma.rateBucket.deleteMany({ where: { key: { in: buckets } } })
    vi.unstubAllEnvs(); await prisma.$disconnect()
  }
})
