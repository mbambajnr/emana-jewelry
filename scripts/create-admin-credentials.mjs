import { pbkdf2Sync, randomBytes } from "node:crypto"

// Generates credentials for a new installation; does not update any account or file.
const password = randomBytes(24).toString("base64url")
const salt = randomBytes(16).toString("hex")
const hash = pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex")
console.log("Store the password in your password manager. Keep both values private.")
console.log(`Password: ${password}`)
console.log(`ADMIN_PASSWORD_HASH=${salt}:${hash}`)
