import type { RPCClient } from "./rpc"
import { bitcoinToSats } from "./unit"

/**
 * Reads an account's balance from the node, in the shape `accounts.balance` keeps it.
 *
 * @param rpcClient - A client already pointed at the account's wallet with `setWallet`
 * @returns Every amount in satoshis
 */
export async function readNodeBalance(rpcClient: RPCClient): Promise<Account.Balance> {
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
