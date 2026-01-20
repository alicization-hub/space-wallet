import { RPCClient } from '@/libs/bitcoin/rpc'
import { logger } from '@/libs/logger'

async function main() {
  logger('🔍 Checking Bitcoin Core status...')
  const startedAt = new Date()

  try {
    const rpcClient = new RPCClient()
    const [chain, network, mempool] = (await rpcClient.batch([
      { method: 'getblockchaininfo' },
      { method: 'getnetworkinfo' },
      { method: 'getmempoolinfo' }
    ])) as [IBlockchain.Info, INetwork.Info, IMempool.Info]

    logger(`📊 Chain: ${chain.chain}`)
    logger(`📦 Blocks: ${chain.blocks} / ${chain.headers}`)
    logger(`🔄 Sync Progress: ${(chain.verificationprogress * 100).toFixed(2)} %`)
    logger(`🌐 Connections: ${network.connections}`)
    logger(`📝 Mempool: ${mempool.size} transactions`)
    logger(`💻 Version: ${network.subversion}`)
    logger('✅ Bitcoin Core Connection: SUCCESS', startedAt)

    if (chain.verificationprogress < 0.99) {
      logger('⚠️ WARNING: Bitcoin Core is still syncing. Balance data may be incomplete.')
    }
  } catch (error: any) {
    logger(`❌ Bitcoin Core Connection Failed: ${error.message}`, startedAt)
  }

  process.exit()
}

main()
