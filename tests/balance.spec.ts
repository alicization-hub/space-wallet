import { setTimeout } from "timers/promises"

import { eq } from "drizzle-orm"

import { db, schema } from "@/drizzle"
import { RPCClient } from "@/libs/bitcoin/rpc"
import { bitcoinToSats } from "@/libs/bitcoin/unit"
import { logger } from "@/libs/logger"

async function readBalance(accountId: string) {
  const rpcClient = new RPCClient()
  await rpcClient.setWallet(accountId)
  await setTimeout(2_000)
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

async function main() {
  const startedAt = new Date()

  const accountIds = await db.select({ id: schema.accounts.id }).from(schema.accounts)
  for await (const account of accountIds) {
    const balance = await readBalance(account.id)
    await db
      .update(schema.accounts)
      .set({
        balance
      })
      .where(eq(schema.accounts.id, account.id))

    await setTimeout(2e3)
  }

  logger(`✅ The balance has been successfully updated.`, startedAt)
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
