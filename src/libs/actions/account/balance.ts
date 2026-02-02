'use server'

import { eq } from 'drizzle-orm'

import { RPCClient } from '@/libs/bitcoin/rpc'
import { bitcoinToSats } from '@/libs/bitcoin/unit'
import { db, schema } from '@/libs/drizzle'

export async function syncAccountBalance(accountId: string) {
  const rpcClient = new RPCClient()
  await rpcClient.setWallet(accountId)
  const [walletInfo, utxos] = (await rpcClient.batch([
    {
      method: 'getwalletinfo'
    },
    {
      method: 'listunspent',
      params: [1, 1e6, [], true]
    }
  ])) as [IWallet.Info, Unspent.List[]]

  await db
    .update(schema.accounts)
    .set({
      balance: {
        confirmed: utxos.reduce((acc, utxo) => acc + bitcoinToSats(utxo.amount), 0),
        unconfirmed: bitcoinToSats(walletInfo.unconfirmed_balance),
        immature: bitcoinToSats(walletInfo.immature_balance),
        total: bitcoinToSats(walletInfo.balance),
        spendable: utxos
          .filter((utxo) => utxo.confirmations > 1)
          .reduce((acc, utxo) => acc + bitcoinToSats(utxo.amount), 0)
      }
    })
    .where(eq(schema.accounts.id, accountId))
}
