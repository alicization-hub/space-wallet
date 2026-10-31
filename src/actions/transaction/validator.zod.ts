import { z } from "zod"

import { MAX_FEE_RATE, MAX_INPUTS } from "@/libs/bitcoin/constants"
import {
  addressValidator,
  passphraseInputValidator,
  queryValidator as query,
  txidValidator
} from "@/libs/validator.zod"

export const queryValidator = query

export const createValidator = z.object({
  passphrase: passphraseInputValidator,
  recipientAddress: addressValidator,
  amount: z
    .number({ error: "Enter the amount to send" })
    .min(0.00001, { error: "Minimum amount must be at least 0.00001 BTC" })
    .max(2, { error: "Maximum amount must not exceed 2" }),
  fee: z
    .number({ error: "Select a transaction fee" })
    .min(1)
    .max(MAX_FEE_RATE, {
      error: `The fee rate must not exceed ${MAX_FEE_RATE} sat/vB`
    }),
  utxos: z
    .array(
      z.object({
        txid: txidValidator,
        vout: z.int().min(0),
        address: addressValidator
      }),
      { error: "Select at least one UTXO" }
    )
    .min(1, { error: "Select at least one UTXO" })
    .max(MAX_INPUTS)
    .refine(
      (utxos) =>
        new Set(utxos.map(({ txid, vout }) => `${txid}:${vout}`)).size === utxos.length,
      { error: "The same UTXO was selected twice" }
    ),
  notes: z.string().max(1024).optional()
})

export type QueryValidator = z.infer<typeof queryValidator>

/**
 * What the account page shows and what `syncAccount` goes through.
 */
export const LATEST_TRANSACTIONS = { page: 1, take: 6 } satisfies QueryValidator

export type CreateValidator = z.infer<typeof createValidator>
