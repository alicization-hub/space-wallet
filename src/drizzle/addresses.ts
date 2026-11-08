import { and, eq, inArray } from "drizzle-orm"

import { db, schema } from "."

const CHUNK_SIZE = 100

/**
 * Marks an account's addresses as used when they appear in its confirmed transactions. An address is
 * never set back to unused. Addresses of other parties, and the empty or `coinbase` placeholders,
 * match no row of this account. Callers check that the wallet owns the account first.
 *
 * @param transactions - As `formatTransaction` gives them
 * @returns How many addresses were newly marked
 */
export async function markAddressesUsed(
  accountId: string,
  transactions: Pick<Transaction.Schema, "status" | "inputs" | "outputs">[]
) {
  const addrs = Array.from(
    new Set(
      transactions
        .filter((tx) => tx.status === "confirmed")
        .flatMap((tx) => [...tx.inputs, ...tx.outputs].map((r) => r.address))
    )
  )

  if (addrs.length === 0) return 0

  return db.transaction(async (tx) => {
    let marked = 0

    for (let i = 0; i < addrs.length; i += CHUNK_SIZE) {
      const chunk = addrs.slice(i, i + CHUNK_SIZE)

      const rows = await tx
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
        .returning({ id: schema.addresses.id })

      marked += rows.length
    }

    return marked
  })
}
