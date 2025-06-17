import { z } from 'zod'

import { mnemonic } from '../bitcoin/mnemonic'
import { passphraseSchema } from '../validator.zod'

export const walletValidator = z.object({
  slug: z.string(),
  name: z.string(),
  mnemonic: z.string().refine((value) => mnemonic.validate(value), 'Invalid mnemonic'),
  passphrase: passphraseSchema
})

export const createWalletValidator = walletValidator.omit({ slug: true })
export const updateWalletValidator = walletValidator.pick({ slug: true, name: true }).partial()

export type WalletValidator = z.infer<typeof walletValidator>
export type CreateWalletValidator = z.infer<typeof createWalletValidator>
export type UpdateWalletValidator = z.infer<typeof updateWalletValidator>
