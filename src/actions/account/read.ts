import "server-only"

import { and, asc, eq } from "drizzle-orm"
import { omit, pick } from "ramda"
import { z } from "zod"

import { accountColumns, db, schema, walletColumns } from "@/drizzle"

/**
 * Before Core 30's `getwalletinfo` lost its balances, a sync could store `null` for them. The page has
 * to render anyway, because the sync that repairs the row runs from the page.
 */
function withoutNulls(balance: Account.Balance): Account.Balance {
  return {
    confirmed: balance.confirmed ?? 0,
    unconfirmed: balance.unconfirmed ?? 0,
    immature: balance.immature ?? 0,
    total: balance.total ?? 0,
    spendable: balance.spendable ?? 0
  }
}

/**
 * Reads an account for its page, with its wallet and without secrets. Not a Server Action: the client
 * gets it through the page.
 *
 * @param accountId - An untrusted ID, from the URL
 * @returns The account, or `undefined` when the ID isn't valid, or the account or its wallet is inactive
 */
export async function readAccount(accountId: string) {
  const id = z.uuid().safeParse(accountId)
  if (!id.success) return undefined

  const [account] = await db
    .select({
      ...omit(["walletId"], accountColumns),
      wallet: omit(["bio", "passkey"], walletColumns)
    })
    .from(schema.accounts)
    .innerJoin(schema.wallets, eq(schema.wallets.id, schema.accounts.walletId))
    .where(
      and(
        eq(schema.accounts.id, id.data),
        eq(schema.accounts.isActive, true),
        eq(schema.wallets.isActive, true)
      )
    )

  return account && { ...account, balance: withoutNulls(account.balance) }
}

/**
 * Lists the active accounts of a wallet, for the account tabs.
 */
export async function readAccounts(walletId: string) {
  return db
    .select(pick(["id", "purpose", "index"], accountColumns))
    .from(schema.accounts)
    .where(
      and(eq(schema.accounts.walletId, walletId), eq(schema.accounts.isActive, true))
    )
    .orderBy(asc(schema.accounts.purpose), asc(schema.accounts.index))
}

/**
 * The account `/` opens: the first one of the oldest active wallet.
 *
 * @returns The account's ID, or `undefined` when there is no wallet yet
 */
export async function readFirstAccount() {
  const [account] = await db
    .select(pick(["id"], accountColumns))
    .from(schema.accounts)
    .innerJoin(schema.wallets, eq(schema.wallets.id, schema.accounts.walletId))
    .where(and(eq(schema.accounts.isActive, true), eq(schema.wallets.isActive, true)))
    .orderBy(
      asc(schema.wallets.createdAt),
      asc(schema.accounts.purpose),
      asc(schema.accounts.index)
    )
    .limit(1)

  return account
}
