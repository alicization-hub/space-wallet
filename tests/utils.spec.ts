import { setTimeout } from "timers/promises"

import { eq } from "drizzle-orm"

import { db, schema } from "@/drizzle"
import { Cipher } from "@/libs/cipher"
import { logger } from "@/libs/logger"
import { hashPassword, verifyPassword } from "@/libs/password"

import { commandInput } from "./cmd.spec"

async function main() {
  const startedAt = new Date()

  try {
    const wallets = await db.select().from(schema.wallets)
    for await (const wallet of wallets) {
      logger(`📝 ${wallet.slug}`)

      const passkey = await commandInput("🔑 Enter passkey")
      const isValid = await verifyPassword(passkey, wallet.passkey)
      if (!isValid) {
        throw new Error("Invalid passphrase.")
      } else {
        const plainText = await Cipher.decrypt(wallet.bio, passkey)
        await setTimeout(2e3)

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
  } catch (error) {
    logger(`⚠️ An error occurred: ${error}`, startedAt)
  }

  process.exit()
}

// main()
