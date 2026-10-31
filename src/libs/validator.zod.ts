import { bech32, bech32m } from "@scure/base"
import { z } from "zod"

/**
 * Stops Zod from compiling validators with `new Function`. The CSP blocks it in the browser, and
 * the attempt alone would report a violation.
 */
z.config({ jitless: true })

export const queryValidator = z.object({
  page: z.int().min(1),
  take: z.int().min(1).max(100),
  status: z.enum(["all", "active", "inactive"]).optional(),
  search: z
    .string()
    .trim()
    .transform((value) => (value === "" ? undefined : value))
    .optional()
})

/**
 * Checks a passphrase someone is typing to unlock an existing wallet. The real check is the argon2
 * hash, and old wallets may not meet today's strength rules, so this only bounds the length that
 * reaches the hash.
 */
export const passphraseInputValidator = z
  .string()
  .nonempty({ error: 'This field "passphrase" is required' })
  .max(256, { error: "Passphrase is too long" })

/**
 * Strength rules for a new passphrase (`tests/wallet.spec.ts`). It also encrypts the seed and is
 * the BIP-39 passphrase, so it can never be changed without moving the funds to a new wallet.
 */
export const passphraseValidator = z
  .string()
  .min(12, { error: "Passphrase must be at least 12 characters long" })
  .max(64, { error: "Passphrase must not exceed 64 characters" })
  .regex(/[0-9]/, { error: "Passphrase must contain at least one number" })
  .regex(/[a-z]/, { error: "Passphrase must contain at least one lowercase letter" })
  .regex(/[A-Z]/, { error: "Passphrase must contain at least one uppercase letter" })
  .regex(/[!@#$%&\-_]/, {
    error: "Passphrase must contain at least one special character (!@#$%&-_)"
  })
  .regex(/^[a-zA-Z0-9!@#$%&\-_]+$/, {
    error:
      "Passphrase can only contain letters, numbers, and these special characters: !@#$%&-_"
  })
  .refine((value) => !/(.)\1\1/.test(value), {
    error: "Passphrase cannot have 3 or more identical characters in sequence."
  })
  .refine(
    (value) => {
      // Check for common patterns (e.g., "123", "abc")
      const commonPatterns = [
        "123",
        "234",
        "345",
        "456",
        "567",
        "678",
        "789",
        "890",
        "abc",
        "bcd",
        "cde",
        "def",
        "efg",
        "fgh",
        "ghi",
        "hij",
        "ijk",
        "jkl",
        "klm",
        "lmn",
        "mno",
        "nop",
        "opq",
        "pqr",
        "qrs",
        "rst",
        "stu",
        "tuv",
        "uvw",
        "vwx",
        "wxy",
        "xyz",
        "qwerty",
        "asdfgh",
        "zxcvbn"
      ]

      return !commonPatterns.some((pattern) => value.toLowerCase().includes(pattern))
    },
    { error: "Passphrase contains a common pattern or sequence." }
  )

/**
 * Mainnet only, like the rest of the wallet (`NETWORK` in `@/libs/bitcoin`).
 */
export const addressValidator = z
  .string()
  .nonempty({ error: 'This field "address" is required' })
  .refine(
    (address) => {
      try {
        if (address.startsWith("bc1q")) {
          return bech32.decode(address as `bc1${string}`).prefix === "bc"
        }

        if (address.startsWith("bc1p")) {
          return bech32m.decode(address as `bc1${string}`).prefix === "bc"
        }

        return false
      } catch {
        return false
      }
    },
    { error: "Invalid Bitcoin address (only SegWit and Taproot supported)." }
  )

export const txidValidator = z
  .string()
  .nonempty({ error: 'This field "txid" is required' })
  .length(64)
  .regex(/^[0-9a-fA-F]{64}$/, { error: "Invalid TXID: must be 64-character hex string." })
