import { secondsToMilliseconds } from 'date-fns'

import { RPC } from '@/constants/env'

/**
 * Bitcoin Core RPC.
 *
 * @link https://developer.bitcoin.org/reference/rpc
 * @link https://gist.github.com/kallewoof/cff9aa73c6e73bc2a180cfae1e0ab640
 */
export class RPCClient {
  protected walletName: string = 'watchonly'

  /**
   * Creates an instance of rpcClient.
   * @param {string} walletName Bitcoin Core wallet name, Optional.
   * @default "watchonly"
   */
  constructor(walletName?: string) {
    this.walletName = walletName ?? this.walletName
  }

  /**
   * Calls a Bitcoin Core RPC method and returns the result.
   *
   * @param method The RPC method to call.
   * @param params The parameters to pass to the RPC method.
   * @returns The result of the RPC method, or an error if the call fails.
   */
  private async call<T = any>(method: string, params: any[] = []): Promise<T> {
    const vid = `curl-${method}-${Math.random().toString(16).slice(2)}`
    const url = `http://${RPC.hostname}:${RPC.port}/wallet/${this.walletName}`
    const auth = Buffer.from(`${RPC.username}:${RPC.password}`).toString('base64')

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: vid,
        method,
        params
      }),
      signal: AbortSignal.timeout(secondsToMilliseconds(10))
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`)
    }

    const { result, error } = await res.json()
    if (error) {
      throw new Error(`Bitcoin Core RPC Error: ${error.message}`)
    }

    return result
  }

  public async getChain() {
    return this.call<IBlockchain.Info>('getblockchaininfo')
  }

  public async getNetwork() {
    return this.call<INetwork.Info>('getnetworkinfo')
  }

  public async getMempool() {
    return this.call<IMempool.Info>('getmempoolinfo')
  }

  public async getWallet() {
    return this.call<IWallet.Info>('getwalletinfo')
  }

  public async createWallet(
    name: string,
    disablePrivateKeys: boolean = true,
    blank: boolean = true,
    avoidReuse: boolean = true,
    passphrase: string = ''
  ) {
    return this.call<IWallet.Created>('createwallet', [
      name,
      disablePrivateKeys,
      blank,
      passphrase,
      avoidReuse,
      null
    ])
  }

  public async getDescriptor(descriptor: string) {
    return this.call<Descriptor.Info>('getdescriptorinfo', [descriptor])
  }

  public async importDescriptors(descriptors: Descriptor.ImportRequest[]) {
    return this.call<Descriptor.ImportResult>('importdescriptors', [descriptors])
  }
}
