import { z } from 'zod'

import { passphraseSchema, queryValidator as query } from '@/libs/validator.zod'

export const queryValidator = z.object({
  ...query.omit({ status: true, search: true }).shape,
  status: z.enum(['all', 'used', 'unused']).optional(),
  type: z.enum(['all', 'change', 'receive']).optional()
})

export const createValidator = z.object({
  passphrase: passphraseSchema
})

export type QueryValidator = z.infer<typeof queryValidator>
export type CreateValidator = z.infer<typeof createValidator>
