import "server-only"
import { pbkdf2, randomBytes, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"
const derive = promisify(pbkdf2)
export async function hashPassword(value: string) {
  const salt = randomBytes(16).toString("hex")
  const hash = await derive(value, salt, 100000, 64, "sha512")
  return `${salt}:${hash.toString("hex")}`
}
export async function verifyPassword(input: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":")
  if (!salt || !hash) return false
  const derived = await derive(input, salt, 100000, 64, "sha512"), expected = Buffer.from(hash, "hex")
  return expected.length === derived.length && timingSafeEqual(expected, derived)
}
