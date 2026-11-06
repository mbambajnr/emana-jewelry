import "server-only"
import { readAdminCredential, credentialIdentity } from "./admin-credentials"
import { hashPassword, verifyPassword } from "./password-crypto"
import { startAdminOtp, verifyAdminOtp, OtpError } from "./admin-otp"

export async function beginPasswordChange(current: string, next: string, confirm: string) {
  if (!current || current.length > 1024) throw new OtpError("Enter your current password.", true)
  if (Array.from(next).length < 12 || next.length > 128) throw new OtpError("Use a new password of 12–128 characters.", true)
  if (next !== confirm) throw new OtpError("The new passwords do not match.", true)
  const credential = await readAdminCredential()
  if (!await verifyPassword(current, credential.passwordHash)) throw new OtpError("Your current password is incorrect.", true)
  if (current === next) throw new OtpError("Choose a different new password.", true)
  const pendingHash = await hashPassword(next)
  // Recheck before sending so a concurrent password change cannot authorize this request.
  if ((await readAdminCredential()).passwordHash !== credential.passwordHash) throw new OtpError("Your credentials changed. Sign in again.", true)
  return startAdminOtp("password-change", pendingHash, credential.passwordHash)
}
export async function completePasswordChange(token: string | undefined, code: string) {
  const identity = credentialIdentity()
  await verifyAdminOtp(token, code, "password-change", async (tx, pendingHash, verifiedHash) => {
    if (!pendingHash) throw new OtpError("Please start the password change again.", true)
    const changed = await tx.adminCredential.updateMany({ where: { ...identity, passwordHash: verifiedHash }, data: { passwordHash: pendingHash } })
    if (changed.count !== 1) throw new OtpError("Your credentials changed. Sign in again.", true)
  })
}
