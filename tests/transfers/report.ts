import { RPCError, type RPCClient } from "@/libs/bitcoin/rpc"
import { satsToBitcoin } from "@/libs/bitcoin/unit"
import { logger } from "@/libs/logger"

import { commandInput, toPrintable } from "../cmd.spec"
import { toGroups } from "./ask"
import type { Transfer } from "./sign"

/**
 * How many characters of the recipient the owner types to approve a send.
 */
const APPROVAL_LENGTH = 8

function toBitcoin(sats: number) {
  return `${satsToBitcoin(sats).toFixed(8)} BTC`
}

function toCoins({ coins }: Transfer) {
  return coins.map(({ txid, vout }) => `${toPrintable(txid)}:${vout}`).join(", ")
}

/**
 * Everything here comes from the signed bytes, or from coins checked against them.
 */
export function showReview(transfer: Transfer) {
  const { recipient, amount, fee, feeRate, change } = transfer

  console.info(`
Check this against where you got the address:

  Recipient  ${toGroups(recipient)}
  Amount     ${toBitcoin(amount)}
  Fee        ${fee} sats (${feeRate.toFixed(2)} sat/vB)
  Change     ${change ? `${toBitcoin(change.amount)} to ${change.address}` : "none: what's left goes to the fee"}
  Coins      ${toCoins(transfer)}
`)
}

export async function isApproved({ recipient }: Transfer) {
  const answer = await commandInput(
    `Type the last ${APPROVAL_LENGTH} characters of the recipient to send`,
    { isHidden: false }
  )

  return answer.trim() === recipient.slice(-APPROVAL_LENGTH)
}

/**
 * Asks the node once and stops. An answer that says no means nothing went out. Any other failure
 * means no answer arrived, so what the node did is unknown, and sending again from other coins could
 * pay twice.
 */
export async function broadcastTransfer(rpcClient: RPCClient, transfer: Transfer) {
  try {
    await rpcClient.broadcastTransaction(transfer.hex)
  } catch (error) {
    if (error instanceof RPCError) {
      throw new Error(
        `The node refused the transaction, so nothing was sent. ${toPrintable(error.message)}`
      )
    }

    const reason = error instanceof Error ? error.message : String(error)

    throw new Error(`The node didn't answer: ${toPrintable(reason)}
   The transaction may or may not have gone out.
   Transaction: ${transfer.id}
   Coins: ${toCoins(transfer)}
   Search for this transaction ID on mempool.space or another block explorer:
   https://mempool.space/tx/${transfer.id}
   Then run this script again: it lists unconfirmed sends first.
   If it's in neither place and you still want to send, pick these same coins,
   so it can't pay twice.`)
  }

  logger(`✅ Sent: ${transfer.id}`)
}
