import { RPCClient } from "@/libs/bitcoin/rpc"
import { logger } from "@/libs/logger"

import {
  askAmount,
  askFeeRate,
  askRecipient,
  chooseAccount,
  chooseCoins,
  confirmPending,
  requireSyncedNode
} from "./ask"
import { broadcastTransfer, isApproved, showReview } from "./report"
import { signTransfer } from "./sign"

/**
 * Every step of a send, in order. The work is in the files next to this one.
 */
export async function runTransfer() {
  const rpcClient = new RPCClient()
  await requireSyncedNode(rpcClient)

  const account = await chooseAccount()
  await rpcClient.setWallet(account.id)
  await confirmPending(rpcClient)

  const coins = await chooseCoins(rpcClient)
  const recipient = await askRecipient(rpcClient)
  const amount = await askAmount(coins)
  const feeRate = await askFeeRate(rpcClient)

  const transfer = await signTransfer(rpcClient, account, {
    coins,
    recipient,
    amount,
    feeRate
  })
  showReview(transfer)

  if (await isApproved(transfer)) await broadcastTransfer(rpcClient, transfer)
  else logger("🚫 Nothing was sent.")
}
