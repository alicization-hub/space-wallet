import { z } from 'zod'

import { passphraseSchema, queryValidator as query } from '@/libs/validator.zod'

export const paramValidator = z.object({ id: z.string().uuid() })
export const queryValidator = query.omit({ status: true })

export const createValidator = z.object({})

export const switchValidator = z.object({
  accountId: z.string().uuid(),
  passphrase: passphraseSchema
})

export type ParamValidator = z.infer<typeof paramValidator>
export type QueryValidator = z.infer<typeof queryValidator>

export type CreateValidator = z.infer<typeof createValidator>
export type SwitchValidator = z.infer<typeof switchValidator>
