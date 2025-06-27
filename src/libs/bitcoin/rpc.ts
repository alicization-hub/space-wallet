import { secondsToMilliseconds } from 'date-fns'

import { RPC } from '@/constants/env'

/**
 * Bitcoin Core RPC.
 * Creates an instance of rpcClient.
 *
 * @link https://developer.bitcoin.org/reference/rpc
 * @link https://gist.github.com/kallewoof/cff9aa73c6e73bc2a180cfae1e0ab640
 */
export class RPCClient {
  protected walletName: string | undefined

  /**
   * Calls a Bitcoin Core RPC method and returns the result.
   *
   * @param method The RPC method to call.
   * @param params The parameters to pass to the RPC method.
   * @returns The result of the RPC method, or an error if the call fails.
   */
  private async call<T = any>(method: string, params: any[] = []): Promise<T> {
    const vid = `curl-${method}-${Math.random().toString(16).slice(2)}`
    const url = `http://${RPC.hostname}:${RPC.port}`
    const pathname = this.walletName ? `/wallet/${this.walletName}` : ''
    const auth = Buffer.from(`${RPC.username}:${RPC.password}`).toString('base64')

    const res = await fetch(url + pathname, {
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
      signal: AbortSignal.timeout(secondsToMilliseconds(60))
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

  public async getPeer() {
    return this.call<INetwork.Peer[]>('getpeerinfo')
  }

  public async getMempool() {
    return this.call<IMempool.Info>('getmempoolinfo')
  }

  public async getWallet() {
    return this.call<IWallet.Info>('getwalletinfo')
  }

  /**
   * @param walletName Bitcoin Core wallet name, Optional.
   */
  public async setWallet(walletName?: string) {
    this.walletName = walletName

    if (this.walletName) {
      const wallets = await this.call<string[]>('listwallets') // List of wallets has loaded.
      if (wallets.indexOf(this.walletName) < 0) {
        await this.loadWallet()
      }
    }
  }

  public async loadWallet(loadOnStartup: boolean | null = true) {
    return this.call('loadwallet', [this.walletName, loadOnStartup])
  }

  public async unloadWallet() {
    return this.call('unloadwallet', [this.walletName])
  }

  public async createWallet(
    name: string,
    disablePrivateKeys: boolean = true,
    blank: boolean = true,
    avoidReuse: boolean = true,
    passphrase: string = '',
    loadOnStartup: boolean | null = true
  ) {
    return this.call<IWallet.Created>('createwallet', [
      name,
      disablePrivateKeys,
      blank,
      passphrase,
      avoidReuse,
      loadOnStartup
    ])
  }

  /**
   * Get the information of a descriptor.
   *
   * @param descriptor The descriptor to query.
   */
  public async getDescriptor(descriptor: string): Promise<Descriptor.Info> {
    return this.call<Descriptor.Info>('getdescriptorinfo', [descriptor])
  }

  /**
   * Import descriptors into the wallet.
   * This RPC call is used to import descriptors into the wallet.
   *
   * @param descriptors An array of descriptors to import.
   */
  public async importDescriptors(descriptors: Descriptor.ImportRequest[]) {
    return this.call<Descriptor.ImportResult>('importdescriptors', [descriptors])
  }

  /**
   * Returns array of unspent transaction outputs
   *
   * with between minconf and maxconf (inclusive) confirmations.
   * Optionally filter to only include txouts paid to specified addresses.
   *
   * @param minConfirmation The minimum confirmations to filter
   * @param maxConfirmation The maximum confirmations to filter
   * @param addresses The bitcoin addresses to filter
   * @param includeUnsafe Include outputs that are not safe to spend See description of "safe" attribute below.
   * @param queryOptions JSON with query options
   */
  public async listUnspent(
    minConfirmation: number = 1,
    maxConfirmation: number = 1e6,
    addresses: string[] = [],
    includeUnsafe: boolean = true,
    queryOptions?: Unspent.QueryOptions
  ) {
    return this.call<Unspent.List[]>('listunspent', [
      minConfirmation,
      maxConfirmation,
      addresses,
      includeUnsafe,
      queryOptions
    ])
  }

  /**
   * If a label name is provided, this will return only incoming transactions paying to addresses with the specified label.
   * Returns up to 'count' most recent transactions skipping the first 'from' transactions.
   *
   * @param label If set, should be a valid label name to return only incoming transactions with the specified label,
   * or "*" to disable filtering and return all transactions.
   * @param count The number of transactions to return
   * @param skip The number of transactions to skip
   * @param includeWatchonly Include transactions to watch-only addresses (see 'importaddress')
   */
  public async listTransactions(
    label: string = '*',
    count: number = 10,
    skip: number = 0,
    includeWatchonly: boolean = true
  ) {
    return this.call<ITransaction.List[]>('listtransactions', [label, count, skip, includeWatchonly])
  }

  /**
   * Return the raw transaction data.
   *
   * If blockhash is not null, it will be included in the transaction data.
   *
   * @param txid The transaction id
   * @param blockhash The block hash
   */
  public async getTransaction(txid: string, blockhash?: string): Promise<ITransaction.Raw> {
    return this.call<ITransaction.Raw>('getrawtransaction', [txid, true, blockhash])
  }
}
