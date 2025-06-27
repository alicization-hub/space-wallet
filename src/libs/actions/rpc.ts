'use server'

import { RPCClient } from '../bitcoin/rpc'

const rpcClient = new RPCClient()

export async function getNode() {
  try {
    const chain = await rpcClient.getChain()
    return chain.verificationprogress > 0.97
  } catch (error) {
    return false
  }
}

export async function getRPC() {
  try {
    const [chain, network, peers] = await Promise.all([
      rpcClient.getChain(),
      rpcClient.getNetwork(),
      rpcClient.getPeer()
    ])

    const currentBlockHeight = chain.blocks
      .toString()
      .replace(/\s/g, '')
      .replace(/(\d)(?=(\d{3})+$)/g, '$1 ')

    const currentNetwork = peers.every((peer) => peer.network === 'onion') ? 'Tor Network' : 'Clearnet'

    return {
      blocks: currentBlockHeight,
      connection: `${currentNetwork} (${network.connections})`
    }
  } catch (error) {
    return null
  }
}
