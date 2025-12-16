'use server'

import { cacheLife, cacheTag } from 'next/cache'

import { RPCClient } from '../bitcoin/rpc'

const rpcClient = new RPCClient()

export async function getNode() {
  'use cache'
  cacheTag('rpc-node')
  cacheLife('hours')

  try {
    const chain = await rpcClient.getChain()
    return chain.verificationprogress > 0.97
  } catch (error) {
    return false
  }
}

export async function getRPC() {
  'use cache'
  cacheTag('rpc-info')
  cacheLife('minutes')

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
