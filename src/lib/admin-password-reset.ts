import "server-only"
import { credentialIdentity } from "./admin-credentials"
import { hashPassword, verifyPassword } from "./password-crypto"
import { verifyAdminOtp, OtpError } from "./admin-otp"

export async function completePasswordReset(token: string | undefined, code: string, next: string, confirm: string) {
  if (Array.from(next).length < 12 || next.length > 128) throw new OtpError("Use a new password of 12–128 characters.")
  if (next !== confirm) throw new OtpError("The new passwords do not match.")
  const identity = credentialIdentity()
  await verifyAdminOtp(token, code, "password-reset", async (tx, _pending, currentHash) => {
    if (await verifyPassword(next, currentHash)) throw new OtpError("Choose a different new password.")
    const passwordHash = await hashPassword(next)
    const changed = await tx.adminCredential.updateMany({ where: { ...identity, passwordHash: currentHash }, data: { passwordHash } })
    if (changed.count !== 1) throw new OtpError("This reset is no longer valid. Please request a new code.", true)
  })
}
