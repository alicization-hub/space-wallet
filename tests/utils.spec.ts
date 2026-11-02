import { setTimeout } from "timers/promises"
import { parseArgs } from "util"

import { eq } from "drizzle-orm"
import { z } from "zod"

import { db, schema } from "@/drizzle"
import { Cipher } from "@/libs/cipher"
import { logger } from "@/libs/logger"
import { hashPassword, verifyPassword } from "@/libs/password"

import { commandInput } from "./cmd.spec"

const argsValidator = z.object({
  wallet: z.uuid().nonempty()
})

/**
 * Re-encrypts one wallet's seed and re-hashes its passphrase. The passphrase is asked for in
 * the terminal, and must match the wallet before anything is decrypted.
 *
 * Decrypting and encrypting read the same `CIPHER_*` values, so this only renews the salt,
 * nonce, and hash. It can't move a wallet to new values on its own: if they already changed
 * in the env, `Cipher.decrypt` throws before anything is saved.
 *
 * It overwrites `bio` and `passkey` in the database the env points at, so the call at the
 * bottom of this file stays commented out until it's needed. It needs the owner role in the env, as
 * `drizzle:migrate` does: `web_space` can't read either column.
 *
 * Usage (from the repo root):
 * ```bash
 * bun tests/utils.spec.ts --wallet 019a2b3c-…
 * ```
 */
async function main() {
  const startedAt = new Date()

  const { values } = parseArgs({
    options: {
      wallet: { type: "string" }
    }
  })

  const parsed = argsValidator.safeParse(values)
  if (!parsed.success) {
    logger(
      `🚫 Invalid arguments: ${JSON.stringify(z.flattenError(parsed.error).fieldErrors)}`
    )
    return
  }

  const walletId = parsed.data.wallet
  const [wallet] = await db
    .select()
    .from(schema.wallets)
    .where(eq(schema.wallets.id, walletId))
    .limit(1)

  logger(`📝 Wallet: ${wallet.name}`)

  const passkey = await commandInput("🔑 Enter passkey")
  const isValid = await verifyPassword(passkey, wallet.passkey)
  if (!isValid) {
    throw new Error("Invalid passphrase.")
  } else {
    const plainText = await Cipher.decrypt(wallet.bio, passkey)
    await setTimeout(2_000)

    const bio = await Cipher.encrypt(plainText, passkey)
    const passkeyHash = await hashPassword(passkey)
    await db
      .update(schema.wallets)
      .set({
        bio,
        passkey: passkeyHash
      })
      .where(eq(schema.wallets.id, wallet.id))
  }

  logger(`✅ The wallet has been successfully updated.`, startedAt)
}

// main()
//   .catch((error) => {
//     logger(`🚫 An error occurred: ${error}`)
//     process.exitCode = 1
//   })
//   .finally(async () => {
//     await db.$client.end()
//     process.exit(0)
//   })
