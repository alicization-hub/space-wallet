/**
 * Hashes `wallets.passkey` with Bun's built-in argon2id. Its PHC strings are compatible with the
 * `argon2` npm package used before, so existing hashes keep verifying.
 */
const OPTIONS = {
  algorithm: "argon2id",
  memoryCost: Math.pow(2, 16), // 64MiB
  timeCost: 3
} as const

/**
 * Hashes a password with argon2id and a random salt.
 *
 * @param password - The plain password
 * @returns A PHC string, stored in `wallets.passkey`
 */
export async function hashPassword(password: string) {
  return Bun.password.hash(password, OPTIONS)
}

/**
 * Checks a password against a hash from `hashPassword`.
 *
 * @param password - The plain password to check
 * @param stored - The stored hash
 * @returns `true` when the password matches
 */
export async function verifyPassword(password: string, stored: string) {
  return Bun.password.verify(password, stored, OPTIONS.algorithm)
}
