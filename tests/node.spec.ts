import { countBy } from "es-toolkit"

import { RPCClient } from "@/libs/bitcoin/rpc"
import { logger } from "@/libs/logger"
import {
  formatBytesText,
  formatDifficulty,
  formatHashrate,
  formatPercent,
  formatUptime
} from "@/libs/utils"

/**
 * The name a peer's network is counted under, in the order they're printed. Tor comes first, because
 * the node is meant to reach the network through it.
 */
const PEER_NETWORKS: Record<string, string> = {
  onion: "tor",
  ipv4: "clearnet",
  ipv6: "clearnet",
  i2p: "i2p",
  cjdns: "cjdns",
  not_publicly_routable: "local"
}

/**
 * @example
 * ```ts
 * describePeers(peers) // "10 (8 tor, 2 clearnet)"
 * ```
 */
function describePeers(peers: Network.Peer[]) {
  const counts = countBy(peers, (peer) => PEER_NETWORKS[peer.network] ?? peer.network)
  const names = [...new Set([...Object.values(PEER_NETWORKS), ...Object.keys(counts)])]
  const parts = names
    .filter((name) => counts[name] > 0)
    .map((name) => `${counts[name]} ${name}`)

  return parts.length > 0 ? `${peers.length} (${parts.join(", ")})` : "0"
}

async function main() {
  const startedAt = new Date()

  logger("🔍 Checking Bitcoin Core status...")

  const rpcClient = new RPCClient()
  const [chain, network, mempool, peers, uptime, hashrate] = (await rpcClient.batch([
    { method: "getblockchaininfo" },
    { method: "getnetworkinfo" },
    { method: "getmempoolinfo" },
    { method: "getpeerinfo" },
    { method: "uptime" },
    { method: "getnetworkhashps" }
  ])) as [Blockchain.Info, Network.Info, Mempool.Info, Network.Peer[], number, number]

  const speed = formatHashrate(hashrate)

  logger(`💻 Version: ${network.subversion}`)
  logger(`📊 Chain: ${chain.chain}`)
  logger(`⏳ Uptime: ${formatUptime(uptime)}`)

  logger(`📦 Blocks: ${chain.blocks} / ${chain.headers}`)
  logger(`🔄 Sync Progress: ${(chain.verificationprogress * 100).toFixed(2)} %`)
  logger(
    `💾 Disk occupancy: ${formatBytesText(chain.size_on_disk)}${chain.pruned ? " (pruned)" : ""}`
  )
  logger(`⚡ Hashrate: ${speed.value} ${speed.unit}`)
  logger(`🎯 Difficulty: ${formatDifficulty(chain.difficulty)}`)

  logger(`📝 Mempool: ${mempool.size} transactions`)
  logger(
    `🧠 Mempool memory: ${formatBytesText(mempool.usage)} / ${formatBytesText(mempool.maxmempool)} (${formatPercent(mempool.usage / mempool.maxmempool)})`
  )

  logger(`🌐 Peers: ${describePeers(peers)}`)
  logger("✅ Bitcoin Core Connection: SUCCESS", startedAt)

  if (chain.verificationprogress < 0.97) {
    logger(
      "🚫 WARNING: Bitcoin Core is still syncing. Balance data may be incomplete.",
      startedAt
    )
  }

  process.exit(0)
}

main().catch((error) => {
  logger(`🚫 Bitcoin Core Connection Failed: ${error.message}`)
  process.exitCode = 1
})
