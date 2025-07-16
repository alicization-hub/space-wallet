import { z } from 'zod'

import { mnemonic } from '@/libs/bitcoin/mnemonic'
import { passphraseSchema } from '@/libs/validator.zod'

export const walletValidator = z
  .object({
    slug: z.string().nonempty({ error: 'This field "slug" is required' }),
    name: z.string().nonempty({ error: 'This field "walletName" is required' }),
    mnemonic: z.string().refine(mnemonic.validate, { error: 'Invalid mnemonic seed phrase' }),
    passphrase: passphraseSchema.nonempty({ error: 'This field "passphrase" is required' }),
    confirmPassphrase: passphraseSchema.nonempty({ error: 'This field "confirmPassphrase" is required' }),
    account: z
      .object({
        index: z.number().optional(),
        startedAt: z.iso.datetime().optional()
      })
      .optional()
  })
  .refine((value) => value.passphrase === value.confirmPassphrase, {
    error: 'The confirm passphrases dose not match!',
    path: ['confirmPassphrase']
  })

export const createWalletValidator = walletValidator.omit({ slug: true })
export const updateWalletValidator = walletValidator.pick({ slug: true, name: true }).partial()

export type WalletValidator = z.infer<typeof walletValidator>
export type CreateWalletValidator = z.infer<typeof createWalletValidator>
export type UpdateWalletValidator = z.infer<typeof updateWalletValidator>
