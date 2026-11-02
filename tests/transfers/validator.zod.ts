import { z } from "zod"

import { MAX_FEE_RATE, MAX_INPUTS } from "@/libs/bitcoin/constants"
import { bitcoinToSats } from "@/libs/bitcoin/unit"
import { addressValidator } from "@/libs/validator.zod"

/**
 * One number from a list on the screen.
 */
export function choiceValidator(count: number) {
  return z
    .string()
    .trim()
    .regex(/^\d+$/, { error: "Type one of the numbers." })
    .transform(Number)
    .refine((choice) => choice >= 1 && choice <= count, {
      error: "Type one of the numbers."
    })
}

/**
 * Several numbers from a list on the screen, such as `1,3`.
 */
export function coinsValidator(count: number) {
  return z
    .string()
    .trim()
    .regex(/^\d+(\s*,\s*\d+)*$/, { error: "Type the numbers of the coins, such as 1,3." })
    .transform((value) => value.split(",").map(Number))
    .refine((choices) => choices.every((choice) => choice >= 1 && choice <= count), {
      error: "Type the numbers of the coins, such as 1,3."
    })
    .refine((choices) => new Set(choices).size === choices.length, {
      error: "The same coin was picked twice."
    })
    .refine((choices) => choices.length <= MAX_INPUTS, {
      error: `A transaction can't spend more than ${MAX_INPUTS} coins.`
    })
}

export const recipientValidator = z.string().trim().pipe(addressValidator)

/**
 * An amount in BTC, turned into satoshis. More than 8 decimals is refused, not rounded.
 */
export const amountValidator = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,8})?$/, {
    error: "Type an amount in BTC, with at most 8 decimals."
  })
  .transform(Number)
  .refine((amount) => amount >= 0.00001, {
    error: "Minimum amount must be at least 0.00001 BTC"
  })
  .refine((amount) => amount <= 2, { error: "Maximum amount must not exceed 2 BTC" })
  .transform(bitcoinToSats)

export const feeRateValidator = z
  .string()
  .trim()
  .regex(/^\d+(\.\d+)?$/, { error: "Type a fee rate in sat/vB." })
  .transform(Number)
  .refine((feeRate) => feeRate >= 1, { error: "The fee rate must be at least 1 sat/vB" })
  .refine((feeRate) => feeRate <= MAX_FEE_RATE, {
    error: `The fee rate must not exceed ${MAX_FEE_RATE} sat/vB`
  })
