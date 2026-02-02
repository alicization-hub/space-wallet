import { setTimeout } from 'timers/promises'

import { eq } from 'drizzle-orm'

import { cipher } from '@/libs/cipher'
import { db, schema } from '@/libs/drizzle'
import { logger } from '@/libs/logger'
import { password } from '@/libs/password'
import { passphraseSchema } from '@/libs/validator.zod'

import { commandInput } from './cmd.spec'

async function main() {
  const startedAt = new Date()

  try {
    const wallets = await db.select().from(schema.wallets)
    for await (const wallet of wallets) {
      logger(`📝 ${wallet.slug}`)

      const str = await commandInput('🔑 Enter passkey')
      const passkey = await passphraseSchema.parseAsync(str)
      const isValid = await password.verify(wallet.passkey, passkey)
      if (!isValid) {
        throw new Error('Invalid passphrase.')
      } else {
        const plainText = await cipher.decrypt(wallet.bio, passkey)
        await setTimeout(2e3)

        const bio = await cipher.encrypt(plainText, passkey)
        const passkeyHash = await password.hash(passkey)
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
