import { asc, eq } from "drizzle-orm"

import { db, schema } from "@/drizzle"

/**
 * Prints the wallets and their accounts, without anything secret.
 */
export async function listWallets() {
  const rows = await db
    .select({
      slug: schema.wallets.slug,
      isActive: schema.wallets.isActive,
      accountId: schema.accounts.id,
      purpose: schema.accounts.purpose,
      index: schema.accounts.index
    })
    .from(schema.wallets)
    .leftJoin(schema.accounts, eq(schema.accounts.walletId, schema.wallets.id))
    .orderBy(asc(schema.wallets.slug), asc(schema.accounts.purpose))

  console.table(rows)
}
