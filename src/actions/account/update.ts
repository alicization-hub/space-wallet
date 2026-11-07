"use server"

import { eq } from "drizzle-orm"
import { refresh } from "next/cache"

import { db, schema } from "@/drizzle"
import { readNodeBalance } from "@/libs/bitcoin/balance"
import { READ_TIMEOUT } from "@/libs/bitcoin/constants"
import { RPCClient } from "@/libs/bitcoin/rpc"
import { logger } from "@/libs/logger"

import { withAccount } from "."
import { markAddressesUsed } from "../address/update"
import { readTransactions } from "../transaction/read"
import { LATEST_TRANSACTIONS } from "../transaction/validator.zod"

/**
 * Brings an account up to date with Bitcoin Core and sends the page back rendered fresh, which is how
 * an open page updates (`AccountSync`).
 *
 * A node that doesn't answer is expected, not an error: the page still comes back, and says so.
 */
export const syncAccount = withAccount(async (account) => {
  try {
    // The balance goes first, so that trouble with the history can't hold it up
    const rpcClient = new RPCClient(READ_TIMEOUT)
    await rpcClient.setWallet(account.id)

    const balance = await readNodeBalance(rpcClient)
    await db
      .update(schema.accounts)
      .set({ balance })
      .where(eq(schema.accounts.id, account.id))

    const transactions = await readTransactions(account.id, LATEST_TRANSACTIONS)
    if (transactions) await markAddressesUsed(account.id, transactions.data)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger(`🚫 syncAccount failed: ${message}`)
  }

  refresh()
})
