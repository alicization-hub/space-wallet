import "server-only"

import { READ_TIMEOUT } from "@/libs/bitcoin/constants"
import { RPCClient } from "@/libs/bitcoin/rpc"
import {
  estimateRetarget,
  readEpochStart,
  sumFeeBands,
  toSatsPerVByte
} from "@/libs/bitcoin/telemetry"

const rpcClient = new RPCClient(READ_TIMEOUT)

/**
 * Everything the dashboard shows about the node, or null when the node doesn't answer. It works while
 * the node is still syncing, which is when the dashboard is the only page with anything to say.
 *
 * The node's own addresses stay out of this on purpose: nothing here needs them, and the page opens
 * with nothing typed.
 *
 * It isn't `"use cache"` because a Server Component imports it: Next.js would register the cached
 * function as a server reference, which anyone holding its ID could call directly.
 *
 * @returns Plain numbers and strings, in the node's units except where the name says otherwise
 */
export async function readNodeTelemetry() {
  try {
    const [chain, network, mempool, peers, totals] = (await rpcClient.batch([
      { method: "getblockchaininfo" },
      { method: "getnetworkinfo" },
      { method: "getmempoolinfo" },
      { method: "getpeerinfo" },
      { method: "getnettotals" }
    ])) as [Blockchain.Info, Network.Info, Mempool.Info, Network.Peer[], Network.Totals]

    // Each of these leaves one cell blank if it fails, so a node that lacks one still shows the rest.
    // The fee bands are worked out inside the catch, as the method they read may change shape.
    const [hashrate, feeBands, epochStart] = await Promise.all([
      rpcClient.getHashrate().catch(() => null),
      rpcClient
        .getFeerateDiagram()
        .then(sumFeeBands)
        .catch(() => null),
      rpcClient
        .getBlockHash(readEpochStart(chain.blocks))
        .then((hash) => rpcClient.getBlockHeader(hash))
        .catch(() => null)
    ])

    const isReachable = (name: string) =>
      network.networks.some((item) => item.name === name && item.reachable)

    return {
      hashrate,
      retarget: estimateRetarget(chain, epochStart?.time ?? null),
      chain: {
        blocks: chain.blocks,
        headers: chain.headers,
        difficulty: chain.difficulty,
        medianTime: chain.mediantime,
        sizeOnDisk: chain.size_on_disk,
        isPruned: chain.pruned
      },
      mempool: {
        isLoaded: mempool.loaded,
        size: mempool.size,
        vBytes: mempool.bytes,
        usage: mempool.usage,
        maxUsage: mempool.maxmempool,
        totalFee: mempool.total_fee,
        minFeeRate: toSatsPerVByte(mempool.mempoolminfee),
        minRelayFeeRate: toSatsPerVByte(mempool.minrelaytxfee),
        feeBands
      },
      network: {
        subversion: network.subversion,
        bytesReceived: totals.totalbytesrecv,
        bytesSent: totals.totalbytessent,
        hasIPv4: isReachable("ipv4"),
        hasIPv6: isReachable("ipv6"),
        hasTor: isReachable("onion")
      },
      peers: peers.map((peer) => ({
        id: peer.id,
        address: peer.addr,
        network: peer.network,
        subversion: peer.subver,
        pingTime: peer.pingtime ?? null,
        bytesSent: peer.bytessent,
        bytesReceived: peer.bytesrecv,
        height: peer.synced_blocks,
        isInbound: peer.inbound
      }))
    }
  } catch {
    return null
  }
}

export type NodeTelemetry = NonNullable<Awaited<ReturnType<typeof readNodeTelemetry>>>
