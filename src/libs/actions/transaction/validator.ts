import { z } from 'zod'

import { addressSchema, passphraseSchema, queryValidator, txidSchema } from '@/libs/validator.zod'

export const createValidator = z.object({
  passphrase: passphraseSchema,
  recipientAddress: addressSchema,
  amount: z
    .number()
    .min(0.00001, { error: 'Minimum amount must be at least 0.00001 BTC' })
    .max(2, { error: 'Maximum amount must not exceed 2' }),
  fee: z.number().min(1),
  utxos: z
    .array(
      z.object({
        txid: txidSchema,
        vout: z.number().min(0),
        address: addressSchema
      })
    )
    .min(1),
  notes: z.string().optional()
})

export type QueryValidator = z.infer<typeof queryValidator>
export type CreateValidator = z.infer<typeof createValidator>
