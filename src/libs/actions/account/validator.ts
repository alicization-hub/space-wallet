import { z } from 'zod'

import { passphraseSchema, queryValidator as query } from '@/libs/validator.zod'

export const queryValidator = query.omit({ status: true })

export const createValidator = z.object({})

export const switchValidator = z.object({
  walletId: z.uuid(),
  accountId: z.uuid(),
  passphrase: passphraseSchema.nonempty({ error: 'This field "passphrase" is required' })
})

export type QueryValidator = z.infer<typeof queryValidator>
export type CreateValidator = z.infer<typeof createValidator>
export type SwitchValidator = z.infer<typeof switchValidator>
