"use server"

import { eq } from "drizzle-orm"
import { refresh } from "next/cache"

import { db, schema } from "@/drizzle"
import { READ_TIMEOUT } from "@/libs/bitcoin/constants"
import { RPCClient } from "@/libs/bitcoin/rpc"
import { bitcoinToSats } from "@/libs/bitcoin/unit"
import { logger } from "@/libs/logger"

import { withAccount } from "."
import { markAddressesUsed } from "../address/update"
import { readTransactions } from "../transaction/read"
import { LATEST_TRANSACTIONS } from "../transaction/validator.zod"

async function readNodeBalance(accountId: string): Promise<Account.Balance> {
  const rpcClient = new RPCClient(READ_TIMEOUT)
  await rpcClient.setWallet(accountId)
  const [balances, utxos] = (await rpcClient.batch([
    {
      method: "getbalances"
    },
    {
      method: "listunspent",
      params: [1, 1e6, [], true]
    }
  ])) as [NodeWallet.Balances, Unspent.List[]]

  return {
    confirmed: utxos.reduce((acc, utxo) => acc + bitcoinToSats(utxo.amount), 0),
    unconfirmed: bitcoinToSats(balances.mine.untrusted_pending),
    immature: bitcoinToSats(balances.mine.immature),
    total: bitcoinToSats(balances.mine.trusted),
    spendable: utxos
      .filter((utxo) => utxo.confirmations > 1)
      .reduce((acc, utxo) => acc + bitcoinToSats(utxo.amount), 0)
  }
}

/**
 * Brings an account up to date with Bitcoin Core and sends the page back rendered fresh, which is how
 * an open page updates (`AccountSync`).
 *
 * A node that doesn't answer is expected, not an error: the page still comes back, and says so.
 */
export const syncAccount = withAccount(async (account) => {
  try {
    // The balance goes first, so that trouble with the history can't hold it up
    const balance = await readNodeBalance(account.id)
    await db
      .update(schema.accounts)
      .set({ balance })
      .where(eq(schema.accounts.id, account.id))

    const transactions = await readTransactions(account.id, LATEST_TRANSACTIONS)
    if (transactions) await markAddressesUsed(account.id, transactions.data)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger(`⚠️ syncAccount failed: ${message}`)
  }

  refresh()
})
