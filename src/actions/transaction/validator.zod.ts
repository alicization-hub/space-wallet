import type { z } from "zod"

import { queryValidator as query } from "@/libs/validator.zod"

export const queryValidator = query

export type QueryValidator = z.infer<typeof queryValidator>

/**
 * What the account page shows and what `syncAccount` goes through.
 */
export const LATEST_TRANSACTIONS = { page: 1, take: 6 } satisfies QueryValidator
