'use server'

import { RPCClient } from '../bitcoin/rpc'

export async function useBitcoinCore() {
  try {
    const rpcClient = new RPCClient()
    const chain = await rpcClient.getChain()
    return Boolean(chain?.chain)
  } catch (error) {
    return false
  }
}
