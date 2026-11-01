"use server"

import { and, eq, inArray } from "drizzle-orm"

import { db, schema } from "@/drizzle"

import type { Transaction } from "../transaction/read"

const CHUNK_SIZE = 100

/**
 * Update the address to "used" based on a transaction that has a "confirmed" status. Callers check
 * that the wallet owns the account first.
 */
export async function markAddressesUsed(accountId: string, transactions: Transaction[]) {
  const addrs = Array.from(
    new Set(
      transactions
        .filter((tx) => tx.status === "confirmed")
        .flatMap((tx) => [...tx.inputs, ...tx.outputs].map((r) => r.address))
    )
  )

  if (addrs.length === 0) return

  await db.transaction(async (tx) => {
    for (let i = 0; i < addrs.length; i += CHUNK_SIZE) {
      const chunk = addrs.slice(i, i + CHUNK_SIZE)

      await tx
        .update(schema.addresses)
        .set({
          isUsed: true
        })
        .where(
          and(
            eq(schema.addresses.accountId, accountId),
            eq(schema.addresses.isUsed, false),
            inArray(schema.addresses.address, chunk)
          )
        )
    }
  })
}
