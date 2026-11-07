import "server-only"

import { and, asc, eq } from "drizzle-orm"
import { omit, pick } from "es-toolkit"
import { z } from "zod"

import { db, schema } from "@/drizzle"
import { accountColumns, walletColumns } from "@/drizzle/table-columns"
import { logger } from "@/libs/logger"

export type PublicAccount = Omit<
  NonNullable<Awaited<ReturnType<typeof readAccount>>>,
  "wallet"
>

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
      ...omit(accountColumns, ["walletId"]),
      wallet: omit(walletColumns, ["bio", "passkey"])
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
 * Lists every active wallet with its active accounts, for the navbar's menu. The navbar is a client
 * component on every page, so only what the menu prints leaves here.
 *
 * A database that can't be read must not take the node dashboard down with it, so the failure is
 * logged and the menu says so.
 *
 * @returns The wallets, oldest first, or `null` when the database can't be read
 */
export async function readWalletMenu() {
  try {
    const rows = await db
      .select({
        walletId: schema.wallets.id,
        walletName: schema.wallets.name,
        id: schema.accounts.id,
        label: schema.accounts.label,
        purpose: schema.accounts.purpose,
        balance: schema.accounts.balance
      })
      .from(schema.accounts)
      .innerJoin(schema.wallets, eq(schema.wallets.id, schema.accounts.walletId))
      .where(and(eq(schema.accounts.isActive, true), eq(schema.wallets.isActive, true)))
      .orderBy(
        asc(schema.wallets.createdAt),
        asc(schema.accounts.purpose),
        asc(schema.accounts.index)
      )

    const wallets = new Map<string, MenuWallet>()
    for (const row of rows) {
      const wallet = wallets.get(row.walletId) ?? {
        id: row.walletId,
        name: row.walletName,
        accounts: []
      }

      wallet.accounts.push({
        id: row.id,
        label: row.label,
        purpose: row.purpose,
        total: withoutNulls(row.balance).total
      })
      wallets.set(row.walletId, wallet)
    }

    return [...wallets.values()]
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger(`🚫 readWalletMenu failed: ${message}`)

    return null
  }
}

export type MenuWallet = {
  id: string
  name: string
  accounts: {
    id: string
    label: string
    purpose: Purpose
    total: number
  }[]
}

/**
 * The account `/` opens: the first one of the oldest active wallet.
 *
 * @returns The account's ID, or `undefined` when there is no wallet yet
 */
export async function readFirstAccount() {
  const [account] = await db
    .select(pick(accountColumns, ["id"]))
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
