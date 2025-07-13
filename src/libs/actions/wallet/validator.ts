import { z } from 'zod'

import { mnemonic } from '@/libs/bitcoin/mnemonic'
import { passphraseSchema } from '@/libs/validator.zod'

export const walletValidator = z.object({
  slug: z.string(),
  name: z.string(),
  mnemonic: z.string().refine(mnemonic.validate, { error: 'Invalid mnemonic' }),
  passphrase: passphraseSchema,
  account: z
    .object({
      index: z.number().optional().default(0),
      startedAt: z.iso.datetime().optional()
    })
    .optional()
})

export const createWalletValidator = walletValidator.omit({ slug: true })
export const updateWalletValidator = walletValidator.pick({ slug: true, name: true }).partial()

export type WalletValidator = z.infer<typeof walletValidator>
export type CreateWalletValidator = z.infer<typeof createWalletValidator>
export type UpdateWalletValidator = z.infer<typeof updateWalletValidator>
