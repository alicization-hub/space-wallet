import { z } from 'zod'

import { passphraseSchema, queryValidator as query } from '@/libs/validator.zod'

export const paramValidator = z.object({ id: z.string().uuid() })
export const queryValidator = query.omit({ status: true, search: true }).merge(
  z.object({
    status: z.enum(['all', 'used', 'unused']).optional()
  })
)

export const createValidator = z.object({
  passphrase: passphraseSchema
})

export type ParamValidator = z.infer<typeof paramValidator>
export type QueryValidator = z.infer<typeof queryValidator>
export type CreateValidator = z.infer<typeof createValidator>
