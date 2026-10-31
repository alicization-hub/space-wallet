import { connection } from "next/server"

import { NodeWarning } from "@/components/node-warning"

import { readNodeTelemetry } from "./actions/read"
import { BlockchainPanel } from "./components/blockchain-panel"
import { MempoolPanel } from "./components/mempool-panel"
import { NetworkPanel } from "./components/network-panel"
import { NodeSync } from "./components/sync"
import { WalletLink } from "./components/wallet-link"

export const instant = false

/**
 * The app's home: the state of the node, read fresh on every render. It stays out of the wallet layout
 * because that one hides its page until the node has synced, which is when this page matters most.
 */
export default async function Dashboard() {
  await connection()

  const node = await readNodeTelemetry()

  return (
    <div className='flex flex-col gap-y-12 pt-16 pb-8'>
      {node ? (
        <>
          <BlockchainPanel
            chain={node.chain}
            hashrate={node.hashrate}
            retarget={node.retarget}
          />
          <MempoolPanel mempool={node.mempool} />
          <NetworkPanel network={node.network} peers={node.peers} />
        </>
      ) : (
        <NodeWarning>
          <p className='text-foreground/50 font-normal'>
            This page checks again every 15 seconds.
          </p>
          <div className='pt-4'>
            <WalletLink />
          </div>
        </NodeWarning>
      )}

      <NodeSync />
    </div>
  )
}
