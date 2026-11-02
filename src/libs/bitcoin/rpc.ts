import { secondsToMilliseconds } from "date-fns"
import { NIL, v5 as uuidV5 } from "uuid"
import { z } from "zod"

import { RPC } from "@/constants/env"

const DEFAULT_TIMEOUT = secondsToMilliseconds(60)

/**
 * An answer from the node that says no. Any other error means no answer arrived, so what the node
 * did is unknown.
 */
export class RPCError extends Error {}

/**
 * Bitcoin Core RPC.
 * Creates an instance of rpcClient.
 *
 * @see https://developer.bitcoin.org/reference/rpc
 * @see https://gist.github.com/kallewoof/cff9aa73c6e73bc2a180cfae1e0ab640
 */
export class RPCClient {
  protected walletName: string | undefined
  private readonly timeout: number

  /**
   * @param timeout How long to wait for the node on each call
   */
  constructor(timeout: number = DEFAULT_TIMEOUT) {
    this.timeout = timeout
  }

  /**
   * Sends a request to the node. The wallet name is part of the URL, so `setWallet` only accepts
   * account IDs and it's encoded here as well.
   *
   * @param body The JSON-RPC request, or an array of them for a batch.
   * @param timeout How long to wait for the node. A rescan can take hours, so `importDescriptors`
   * may extend it.
   */
  private async post(body: unknown, timeout: number = this.timeout) {
    const pathname = this.walletName
      ? `/wallet/${encodeURIComponent(this.walletName)}`
      : ""
    const auth = Buffer.from(`${RPC.username}:${RPC.password}`).toString("base64")

    return fetch(`${RPC.protocol}://${RPC.hostname}:${RPC.port}${pathname}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeout),
      // Bun's own idle timeout (5 minutes) would otherwise end a long rescan before `signal` does
      timeout: false
    })
  }

  /**
   * Calls a Bitcoin Core RPC method and returns the result.
   *
   * @param method The RPC method to call.
   * @param params The parameters to pass to the RPC method.
   * @param timeout How long to wait for the node.
   * @returns The result of the RPC method, or an error if the call fails.
   */
  private async call<T = any>(
    method: string,
    params: any[] = [],
    timeout?: number
  ): Promise<T> {
    const res = await this.post(
      {
        jsonrpc: "2.0",
        id: uuidV5(`jsonrpc-${method}`, NIL),
        method,
        params
      },
      timeout
    )

    // Bitcoin Core answers failed calls with the reason in the body, whatever the status, so read that first
    const payload = await res.json().catch(() => null)
    if (payload?.error) {
      throw new RPCError(`Bitcoin Core RPC Error: ${payload.error.message}`)
    }

    if (!res.ok || !payload) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`)
    }

    return payload.result
  }

  /**
   * Executes a batch of RPC calls in a single HTTP request.
   *
   * @param calls An array of RPC calls to execute.
   * @returns An array of results in the same order as the calls.
   */
  public async batch<T = any>(calls: { method: string; params?: any[] }[]): Promise<T[]> {
    if (calls.length === 0) return []

    const res = await this.post(
      calls.map(({ method, params }, index) => ({
        jsonrpc: "2.0",
        id: index,
        method,
        params: params || []
      }))
    )

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`)
    }

    const responses = (await res.json()) as { id: number; result: any; error: any }[]

    // Sort responses by ID to match the order of calls
    // JSON-RPC batch responses are not guaranteed to be in order
    const resultMap = new Map(responses.map((response) => [response.id, response]))

    return calls.map((_, index) => {
      const response = resultMap.get(index)
      if (!response) throw new Error(`Missing response for request ${index}`)
      if (response.error) {
        throw new RPCError(
          `Bitcoin Core RPC Error (Batch ${index}): ${response.error.message}`
        )
      }
      return response.result
    })
  }

  public async getChain() {
    return this.call<Blockchain.Info>("getblockchaininfo")
  }

  public async getNetwork() {
    return this.call<Network.Info>("getnetworkinfo")
  }

  public async getPeer() {
    return this.call<Network.Peer[]>("getpeerinfo")
  }

  public async getMempool() {
    return this.call<Mempool.Info>("getmempoolinfo")
  }

  /**
   * How long the node has been running, in seconds.
   */
  public async getUptime() {
    return this.call<number>("uptime")
  }

  /**
   * The network's estimated hashes per second, over the last 120 blocks.
   */
  public async getHashrate() {
    return this.call<number>("getnetworkhashps")
  }

  /**
   * The whole mempool as cumulative fee over cumulative weight, highest fee rate first. The answer has
   * one point per chunk, so it's far smaller than `getrawmempool true`, which would be hundreds of
   * bytes per transaction. Core hides this method from its `help` list, so it may change between
   * versions: callers must cope with it failing.
   */
  public async getFeerateDiagram() {
    return this.call<Mempool.FeeratePoint[]>("getmempoolfeeratediagram")
  }

  /**
   * The fee rate the node estimates for a transaction to confirm within a number of blocks. A node
   * that has only just synced has no data yet, and answers without `feerate`.
   *
   * @param blocks How many blocks to confirm within.
   */
  public async estimateSmartFee(blocks: number) {
    return this.call<Mempool.FeeEstimate>("estimatesmartfee", [blocks])
  }

  public async getBlockHash(height: number) {
    return this.call<string>("getblockhash", [height])
  }

  /**
   * Headers survive pruning, so unlike `getblockstats` this works on a pruned node too.
   */
  public async getBlockHeader(hash: string) {
    return this.call<Blockchain.BlockHeader>("getblockheader", [hash])
  }

  public async getWallet() {
    return this.call<NodeWallet.Info>("getwalletinfo")
  }

  /**
   * Points the client at a wallet, and loads it if the node hasn't. The web server's RPC user can't
   * load one, so for it this fails with HTTP 403 until `bun tests/wallet.spec.ts load` has run.
   *
   * @param walletName Bitcoin Core wallet name, Optional. Wallets are named after `accounts.id`.
   */
  public async setWallet(walletName?: string) {
    if (walletName !== undefined && !z.uuid().safeParse(walletName).success) {
      throw new Error("Invalid wallet name.")
    }

    this.walletName = walletName

    if (this.walletName) {
      const wallets = await this.call<string[]>("listwallets") // List of wallets has loaded.
      if (wallets.indexOf(this.walletName) < 0) {
        await this.loadWallet()
      }
    }
  }

  public async loadWallet(loadOnStartup: boolean | null = true) {
    return this.call("loadwallet", [this.walletName, loadOnStartup])
  }

  public async unloadWallet() {
    return this.call("unloadwallet", [this.walletName])
  }

  public async createWallet(walletName: string) {
    return this.call<NodeWallet.Created>("createwallet", [
      walletName,
      true, // disable_private_keys: the node only ever watches
      true, // blank
      "", // passphrase
      false, // avoid_reuse: it would hide coins on reused addresses from the balance
      true, // descriptors
      true // load_on_startup: the web server can only read, so it can't load a wallet itself
    ])
  }

  /**
   * Get the information of a descriptor.
   *
   * @param descriptor The descriptor to query.
   */
  public async getDescriptor(descriptor: string): Promise<Descriptor.Info> {
    return this.call<Descriptor.Info>("getdescriptorinfo", [descriptor])
  }

  /**
   * List the wallet's descriptors, with the range the node really watches and the next unused index.
   * Both move on their own: the node tops a range up to its keypool size, and a rescan advances the
   * index past the addresses it finds used.
   */
  public async listDescriptors() {
    return this.call<Descriptor.List>("listdescriptors")
  }

  /**
   * Ask the wallet about an address.
   *
   * @param address The address to query.
   */
  public async getAddressInfo(address: string) {
    return this.call<Descriptor.AddressInfo>("getaddressinfo", [address])
  }

  /**
   * Import descriptors into the wallet.
   * This RPC call is used to import descriptors into the wallet.
   *
   * @param descriptors An array of descriptors to import.
   * @param timeout How long to wait. The call only returns once the rescan has finished.
   */
  public async importDescriptors(
    descriptors: Descriptor.ImportRequest[],
    timeout?: number
  ) {
    return this.call<Descriptor.ImportResult[]>(
      "importdescriptors",
      [descriptors],
      timeout
    )
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
    return this.call<Unspent.List[]>("listunspent", [
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
    label: string = "*",
    count: number = 10,
    skip: number = 0,
    includeWatchonly: boolean = true
  ) {
    return this.call<NodeTransaction.List[]>("listtransactions", [
      label,
      count,
      skip,
      includeWatchonly
    ])
  }

  /**
   * Return the raw transaction data.
   *
   * If blockhash is not null, it will be included in the transaction data.
   *
   * @param txid The transaction id
   * @param blockhash The block hash
   */
  public async getTransaction(txid: string, blockhash?: string) {
    return this.call<NodeTransaction.Raw>("getrawtransaction", [txid, true, blockhash])
  }

  /**
   * Tests if the transaction would be accepted by mempool if it were to be broadcast. Specifically
   * checks for -maxtxsize violations, and whether the transaction is already in the mempool.
   *
   * @param txHex The raw transaction data as a hex string.
   */
  public async verifyTransaction(txHex: string) {
    return this.call<NodeTransaction.Accept[]>("testmempoolaccept", [[txHex]])
  }

  /**
   * Broadcasts a signed transaction to the network.
   *
   * @param txHex The raw transaction data as a hex string.
   */
  public async broadcastTransaction(txHex: string) {
    return this.call("sendrawtransaction", [txHex])
  }
}
