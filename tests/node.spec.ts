import { RPCClient } from "@/libs/bitcoin/rpc"
import { logger } from "@/libs/logger"

async function main() {
  const startedAt = new Date()

  logger("🔍 Checking Bitcoin Core status...")

  const rpcClient = new RPCClient()
  const [chain, network, mempool] = (await rpcClient.batch([
    { method: "getblockchaininfo" },
    { method: "getnetworkinfo" },
    { method: "getmempoolinfo" }
  ])) as [Blockchain.Info, Network.Info, Mempool.Info]

  logger(`📊 Chain: ${chain.chain}`)
  logger(`📦 Blocks: ${chain.blocks} / ${chain.headers}`)
  logger(`🔄 Sync Progress: ${(chain.verificationprogress * 100).toFixed(2)} %`)
  logger(`🌐 Connections: ${network.connections}`)
  logger(`📝 Mempool: ${mempool.size} transactions`)
  logger(`💻 Version: ${network.subversion}`)
  logger("✅ Bitcoin Core Connection: SUCCESS", startedAt)

  if (chain.verificationprogress < 0.99) {
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
