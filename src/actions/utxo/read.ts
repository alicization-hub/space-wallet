"use server"

import { pick } from "es-toolkit"
import { cacheLife, cacheTag } from "next/cache"

import { READ_TIMEOUT } from "@/libs/bitcoin/constants"
import { RPCClient } from "@/libs/bitcoin/rpc"
import { logger } from "@/libs/logger"

import { withAccount } from "../account"

/**
 * Not exported, so nothing can reach this cached read without going through the ownership check in
 * `withAccount`.
 */
async function readCachedUTXOs(accountId: string) {
  "use cache"
  cacheTag(`utxos/${accountId}`)
  cacheLife("seconds")

  const rpcClient = new RPCClient(READ_TIMEOUT)
  await rpcClient.setWallet(accountId)

  const utxos = await rpcClient.listUnspent()
  return utxos.map((utxo) =>
    pick(utxo, ["txid", "vout", "address", "amount", "confirmations", "spendable"])
  )
}

export const readUTXOs = withAccount(async (account) => {
  try {
    return { success: true as const, data: await readCachedUTXOs(account.id) }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger(`🚫 readUTXOs failed: ${message}`)

    return {
      success: false as const,
      message: "The node didn't answer, so the UTXOs can't be listed right now."
    }
  }
})
