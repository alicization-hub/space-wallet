import { parseArgs } from "util"

import { fromUnixTime } from "date-fns"
import { and, eq, inArray } from "drizzle-orm"
import { z } from "zod"

import { db, schema } from "@/drizzle"
import { RPCClient } from "@/libs/bitcoin/rpc"
import { bitcoinToSats } from "@/libs/bitcoin/unit"
import { logger } from "@/libs/logger"

const argsValidator = z.object({
  account: z.uuid().nonempty()
})

async function formatTransaction(rpcClient: RPCClient, tx: NodeTransaction.List) {
  const raw = await rpcClient.getTransaction(tx.txid)

  // Optimize: Batch fetch all parent transactions for inputs
  const batchCalls = raw.vin
    .filter((vin) => vin.txid)
    .map((vin) => ({
      method: "getrawtransaction",
      params: [vin.txid, true]
    }))

  const parentTxs =
    batchCalls.length > 0 ? await rpcClient.batch<NodeTransaction.Raw>(batchCalls) : []

  let fetchIndex = 0
  const inputs: Transaction.Schema["inputs"] = raw.vin.map((vin) => {
    if (!vin.txid) {
      // Handle coinbase transaction
      return {
        txid: "coinbase",
        address: "coinbase",
        value: 0
      }
    }

    const prevTx = parentTxs[fetchIndex++]
    const prevOut = prevTx.vout[vin.vout]
    const { address = "", hex: pkScript = "" } = prevOut.scriptPubKey || {}

    return {
      txid: vin.txid,
      address,
      value: bitcoinToSats(prevOut.value)
    }
  })

  const outputs: Transaction.Schema["outputs"] = raw.vout.map(
    ({ value, scriptPubKey }) => ({
      address: scriptPubKey?.address || "",
      value: bitcoinToSats(value)
    })
  )

  const vin = inputs.reduce((sum, { value }) => sum + value, 0)
  const vout = raw.vout.reduce((sum, { value }) => sum + value, 0)
  const fee = Math.round(vin - bitcoinToSats(vout))

  return {
    txid: raw.txid,
    size: raw.size,
    weight: raw.weight,
    amount: bitcoinToSats(Math.abs(tx.amount)),
    fee,
    inputs,
    outputs,
    type: tx.category as Transaction.Type,
    status: (tx?.confirmations < 1
      ? "pending"
      : tx.abandoned
        ? "abandoned"
        : "confirmed") as Transaction.Status,
    timestamp: fromUnixTime(tx.time),
    confirmations: tx?.confirmations || 0,
    blockHash: tx.blockhash,
    blockHeight: tx?.blockheight,
    blockIndex: tx?.blockindex,
    blockTime: tx?.blocktime
  }
}

async function readTransactions(rpcClient: RPCClient, page: number, take: number) {
  const transactions = await rpcClient.listTransactions("*", take, (page - 1) * take)
  const formatted = await Promise.all(
    transactions.map((tx) => formatTransaction(rpcClient, tx))
  )

  // Sort by timestamp descending (newest first)
  // Since listTransactions returns a batch of "recent" transactions,
  // we just need to sort specifically this batch or reverse it if it's already in chronological order.
  return formatted.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

/**
 * Marks an account's addresses as used when they appear in its 100 newest node transactions.
 * Older transactions aren't read, and an address is never set back to unused. Addresses from
 * other parties, and the empty or `coinbase` placeholders, match no row of this account.
 *
 * It reads the node and writes the database the env points at, so the call at the bottom of
 * this file stays commented out until it's needed.
 *
 * Usage (from the repo root):
 * ```bash
 * bun tests/tx.spec.ts --account 019a2b3c-…
 * ```
 */
async function main() {
  const startedAt = new Date()

  const { values } = parseArgs({
    options: {
      account: { type: "string" }
    }
  })

  const parsed = argsValidator.safeParse(values)
  if (!parsed.success) {
    logger(
      `🚫 Invalid arguments: ${JSON.stringify(z.flattenError(parsed.error).fieldErrors)}`
    )
    return
  }

  const accountId = parsed.data.account
  const page = 1
  const take = 100

  const rpcClient = new RPCClient()
  await rpcClient.setWallet(accountId)

  logger(`🔍 Fetching transactions (page: ${page}, limit: ${take})...`)
  const transactions = await readTransactions(rpcClient, page, take)

  const addrs = new Set(
    transactions.flatMap((tx) => [...tx.inputs, ...tx.outputs].map((r) => r.address))
  )
  await db
    .update(schema.addresses)
    .set({
      isUsed: true
    })
    .where(
      and(
        eq(schema.addresses.accountId, accountId),
        eq(schema.addresses.isUsed, false),
        inArray(schema.addresses.address, Array.from(addrs))
      )
    )

  logger(`✅ Transactions fetched successfully`, startedAt)
}

// main()
//   .catch((error) => {
//     logger(`🚫 An error occurred: ${error}`)
//     process.exitCode = 1
//   })
//   .finally(async () => {
//     await db.$client.end()
//     process.exit(0)
//   })
