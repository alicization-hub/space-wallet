declare namespace IBlockchain {
  /**
   * numeric statistics about BIP9 signalling for a softfork (only for "started" status)
   */
  export type Statistics = {
    /** the length in blocks of the BIP9 signalling period */
    period: number
    /** the number of blocks with the version bit set required to activate the feature */
    threshold: number
    /** the number of blocks elapsed since the beginning of the current period */
    elapsed: number
    /** the number of blocks with the version bit set in the current period */
    count: number
    /**
     * returns false if there are not enough blocks left in this period to pass activation threshold
     */
    possible: boolean
  }

  /**
   * status of bip9 softforks (only for "bip9" type)
   */
  export type SoftForks = {
    /** one of "defined", "started", "locked_in", "active", "failed" */
    status: string
    /**
     * the bit (0-28) in the block version field used to signal this softfork (only for "started" status)
     */
    bit: number
    /** the minimum median time past of a block at which the bit gains its meaning */
    start_time: number
    /**
     * the median time past of a block at which the deployment is considered failed if not yet locked
     * in
     */
    timeout: number
    /** height of the first block to which the status applies */
    since: number
    /** minimum height of blocks for which the rules may be enforced */
    min_activation_height: number
    /** numeric statistics about BIP9 signalling for a softfork (only for "started" status) */
    statistics: Statistics
  }

  export type Info = {
    /** current network name (main, test, signet, regtest) */
    chain: string
    /** the height of the most-work fully-validated chain. The genesis block has height 0 */
    blocks: number
    /** the current number of headers we have validated */
    headers: number
    /** the hash of the currently best block */
    bestblockhash: string
    /** the current difficulty */
    difficulty: number
    /** median time for the current best block */
    mediantime: number
    /** estimate of verification progress [0..1] */
    verificationprogress: number
    /** (debug information) estimate of whether this node is in Initial Block Download mode */
    initialblockdownload: boolean
    /** total amount of work in active chain, in hexadecimal */
    chainwork: string
    /** the estimated size of the block and undo files on disk */
    size_on_disk: number
    /** if the blocks are subject to pruning */
    pruned: boolean
    /** lowest-height complete block stored (only present if pruning is enabled) */
    pruneheight: number
    /** whether automatic pruning is enabled (only present if pruning is enabled) */
    automatic_pruning: boolean
    /** the target size used by pruning (only present if automatic pruning is enabled) */
    prune_target_size: number
    /** status of softforks */
    softforks: Record<string, SoftForks>
    /** any network and blockchain warnings */
    warnings: string
  }
}

declare namespace INetwork {
  export type Detail = {
    /** network (ipv4, ipv6, onion, i2p) */
    name: string
    /** is the network limited using -onlynet? */
    limited: boolean
    /** is the network reachable? */
    reachable: boolean
    /** ("host:port") the proxy that is used for this network, or empty if none */
    proxy: string
    /** Whether randomized credentials are used */
    proxy_randomize_credentials: boolean
  }

  export type LocalAddress = {
    /** network address */
    address: string
    /** network port */
    port: number
    /** relative score */
    score: number
  }

  export type Info = {
    /** the server version */
    version: number
    /** the server subversion string */
    subversion: string
    /** the protocol version */
    protocolversion: number
    /** the services we offer to the network */
    localservices: string
    /** the services we offer to the network, in human-readable form */
    localservicesnames: string[]
    /** true if transaction relay is requested from peers */
    localrelay: boolean
    /** the time offset */
    timeoffset: number
    /** the total number of connections */
    connections: number
    /** the number of inbound connections */
    connections_in: number
    /** the number of outbound connections */
    connections_out: number
    /** whether p2p networking is enabled */
    networkactive: boolean
    /** information per network */
    networks: Detail[]
    /** minimum relay fee for transactions in BTC/kB */
    relayfee: number
    /** minimum fee increment for mempool limiting or BIP 125 replacement in BTC/kB */
    incrementalfee: number
    /** list of local addresses */
    localaddresses: LocalAddress[]
    /** any network and blockchain warnings */
    warnings: string
  }

  export type Peer = {
    /** Peer index */
    id: number
    /** (host:port) The IP address and port of the peer */
    addr: string
    /** (ip:port) Bind address of the connection to the peer */
    addrbind: string
    /** (ip:port) Local address as reported by the peer */
    addrlocal: string
    /** Network (ipv4, ipv6, onion, i2p, not_publicly_routable) */
    network: string
    /**
     * The AS in the BGP route to the peer used for diversifying
     * peer selection (only available if the asmap config flag is set)
     */
    mapped_as: number
    /** The services offered */
    services: string
    /** the services offered, in human-readable form */
    servicesnames: string[]
    /** Whether peer has asked us to relay transactions to it */
    relaytxes: boolean
    /** The UNIX epoch time of the last send */
    lastsend: number
    /** The UNIX epoch time of the last receive */
    lastrecv: number
    /** The UNIX epoch time of the last valid transaction received from this peer */
    last_transaction: number
    /** The UNIX epoch time of the last block received from this peer */
    last_block: number
    /** The total bytes sent */
    bytessent: number
    /** The total bytes received */
    bytesrecv: number
    /** The UNIX epoch time of the connection */
    conntime: number
    /** The time offset in seconds */
    timeoffset: number
    /** ping time (if available) */
    pingtime: number
    /** minimum observed ping time (if any at all) */
    minping: number
    /** ping wait (if non-zero) */
    pingwait: number
    /** The peer version, such as 70001 */
    version: number
    /** The string version */
    subver: string
    /** Inbound (true) or Outbound (false) */
    inbound: boolean
    /** Whether we selected peer as (compact blocks) high-bandwidth peer */
    bip152_hb_to: boolean
    /** Whether peer selected us as (compact blocks) high-bandwidth peer */
    bip152_hb_from: boolean
    /** The starting height (block) of the peer */
    startingheight: number
    /** The last header we have in common with this peer */
    synced_headers: number
    /** The last block we have in common with this peer */
    synced_blocks: number
    inflight: number[]
    /** Any special permissions that have been granted to this peer */
    permissions: string[]
    /** The minimum fee rate for transactions this peer accepts */
    minfeefilter: number
    bytessent_per_msg: Dict<number>
    bytesrecv_per_msg: Dict<number>
    /**
     * Type of connection:
     * outbound-full-relay (default automatic connections),
     * block-relay-only (does not relay transactions or addresses),
     * inbound (initiated by the peer),
     * manual (added via addnode RPC or -addnode/-connect configuration options),
     * addr-fetch (short-lived automatic connection for soliciting addresses),
     * feeler (short-lived automatic connection for testing addresses).
     * Please note this output is unlikely to be stable in upcoming releases as we iterate to
     * best capture connection behaviors.
     */
    connection_type: string
  }
}

declare namespace IMempool {
  export type Info = {
    /** True if the mempool is fully loaded */
    loaded: boolean
    /** Current tx count */
    size: number
    /**
     * Sum of all virtual transaction sizes as defined in BIP 141. Differs from actual serialized size
     * because witness data is discounted
     */
    bytes: number
    /** Total memory usage for the mempool */
    usage: number
    /** Total fees for the mempool in BTC, ignoring modified fees through prioritizetransaction */
    total_fee: number
    /** Maximum memory usage for the mempool */
    maxmempool: number
    /**
     * Minimum fee rate in BTC/kB for tx to be accepted. Is the maximum of minrelaytxfee and minimum
     * mempool fee
     */
    mempoolminfee: number
    /** Current minimum relay fee for transactions */
    minrelaytxfee: number
    /** Incremental relay fee set in BTC/kB */
    incrementalrelayfee: number
    /** Current number of transactions that haven't passed initial broadcast yet */
    unbroadcastcount: number
    /** Whether the mempool is in RBF mode */
    fullrbf: boolean
  }
}

declare namespace IWallet {
  export type Created = {
    /** The wallet name if created successfully. If the wallet was created using a full path, the wallet_name will be the full path. */
    name: string
    /** Warning message if wallet was not loaded cleanly. */
    warning: string
  }

  export type Scanning = {
    /** elapsed seconds since scan start */
    duration: number
    /** scanning progress percentage [0.0, 1.0] */
    progress: number
  }

  export type Info = {
    /** the wallet name */
    walletname: string
    /** the wallet version */
    walletversion: number
    /** the database format (bdb or sqlite) */
    format: string
    /** the total balance of the wallet */
    balance: number
    /** the unconfirmed balance of the wallet */
    unconfirmed_balance: number
    /** the immature balance of the wallet */
    immature_balance: number
    /** the total number of transactions in the wallet */
    txcount: number
    /** how many new keys are pre-generated (only counts external keys) */
    keypoolsize: number
    /** how many new keys are pre-generated for internal use (used for change outputs, only appears if the wallet is using this feature, otherwise external keys are used) */
    keypoolsize_hd_internal: number
    /** the transaction fee configuration, set in BTC/kvB */
    paytxfee: string
    /** false if privatekeys are disabled for this wallet (enforced watch-only wallet) */
    private_keys_enabled: boolean
    /** whether this wallet tracks clean/dirty coins in terms of reuse */
    avoid_reuse: boolean
    /** current scanning details, or false if no scan is in progress */
    scanning: Scanning | null
    /** whether this wallet uses descriptors for scriptPubKey management */
    descriptors: boolean
    /** whether this wallet uses an external signer */
    external_signer: boolean
    /** the Hash160 of the HD seed (only present when HD is enabled) */
    blank: string
    /** the creation time of the wallet */
    birthtime: number
    /** the last processed block */
    lastprocessedblock: {
      hash: string
      height: number
    }
  }
}
