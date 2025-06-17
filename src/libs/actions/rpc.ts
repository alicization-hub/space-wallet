'use server'

import { rpcClient } from '../bitcoin/rpc'

export async function useBitcoinCore() {
  try {
    const chain = await rpcClient.getChain()
    return Boolean(chain?.chain)
  } catch (error) {
    return false
  }
}
