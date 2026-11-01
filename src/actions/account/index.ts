import "server-only"

import { and, eq } from "drizzle-orm"
import { z } from "zod"

import { db, schema } from "@/drizzle"
import { accountColumns } from "@/drizzle/table-columns"
import type { Account } from "@/drizzle/types"

type AccountAction<T extends unknown[], R> = (account: Account, ...args: T) => Promise<R>

/**
 * Reads an account only if it can be used: it exists, it's active, and so is its wallet. This is what
 * stands between an ID from a URL or an action's arguments and Bitcoin Core, where a wallet name goes
 * into the RPC URL and can load a wallet.
 *
 * @param accountId - An untrusted account ID
 * @returns The account, or `null`
 */
export async function readActiveAccount(accountId: unknown) {
  const id = z.uuid().safeParse(accountId)
  if (!id.success) return null

  const [account] = await db
    .select(accountColumns)
    .from(schema.accounts)
    .innerJoin(schema.wallets, eq(schema.wallets.id, schema.accounts.walletId))
    .where(
      and(
        eq(schema.accounts.id, id.data),
        eq(schema.accounts.isActive, true),
        eq(schema.wallets.isActive, true)
      )
    )

  return account ?? null
}

/**
 * Wraps a Server Action or server reader that takes an account ID as its first argument, so it only
 * runs for an account that can be used.
 *
 * @example
 * ```ts
 * export const readUTXOs = withAccount(async (account) => { … })
 * await readUTXOs(accountId)
 * ```
 */
export function withAccount<T extends unknown[], R>(action: AccountAction<T, R>) {
  return async (accountId: string, ...args: T): Promise<R> => {
    const account = await readActiveAccount(accountId)
    if (!account) throw new Error("404 Account not found")

    return action(account, ...args)
  }
}
