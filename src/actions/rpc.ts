import "server-only"

import { READ_TIMEOUT } from "@/libs/bitcoin/constants"
import { RPCClient } from "@/libs/bitcoin/rpc"
import { formatPercent, formatUptime } from "@/libs/utils"

const rpcClient = new RPCClient(READ_TIMEOUT)

/**
 * Whether the node is reachable and synced. This decides whether the app shows anything, so it's
 * asked fresh each time.
 *
 * Nothing in this file uses `"use cache"`: Server Components import it, so Next.js would register a
 * cached function as a server reference, which anyone holding its ID could call directly. These
 * calls are small and the node is local, so there's little to save.
 */
export async function readNodeStatus() {
  const chain = await rpcClient.getChain().catch(() => null)
  return chain !== null && chain.verificationprogress > 0.97
}

/**
 * What the navbar shows about the node, ready to print.
 */
export async function readNodeInfo() {
  try {
    // Timed alone: this call only answers, while the ones below make the node do real work
    const startedAt = performance.now()
    const uptime = await rpcClient.getUptime()
    const latency = performance.now() - startedAt

    const [chain, peers] = await Promise.all([rpcClient.getChain(), rpcClient.getPeer()])

    const currentBlockHeight = chain.blocks
      .toString()
      .replace(/\s/g, "")
      .replace(/(\d)(?=(\d{3})+$)/g, "$1 ")

    // Rounded down while syncing: a node still catching up shouldn't read 100%
    const verification = chain.initialblockdownload
      ? Math.floor(chain.verificationprogress * 100) / 100
      : chain.verificationprogress

    return {
      blocks: currentBlockHeight,
      connection: peers.every((peer) => peer.network === "onion") ? "tor" : "clearnet",
      isSyncing: chain.initialblockdownload,
      verification: formatPercent(verification, 0),
      uptime: formatUptime(uptime),
      latency: `${latency.toFixed(2)} ms`
    }
  } catch {
    return null
  }
}

export type NodeInfo = Awaited<ReturnType<typeof readNodeInfo>>
