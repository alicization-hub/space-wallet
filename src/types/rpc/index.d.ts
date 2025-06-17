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
    /* The wallet name if created successfully. If the wallet was created using a full path, the wallet_name will be the full path. */
    name: string
    /* Warning message if wallet was not loaded cleanly. */
    warning: string
  }

  export type Scanning = {
    /* elapsed seconds since scan start */
    duration: number
    /* scanning progress percentage [0.0, 1.0] */
    progress: number
  }

  export type Info = {
    /* the wallet name */
    walletname: string
    /* the wallet version */
    walletversion: number
    /* the database format (bdb or sqlite) */
    format: string
    /* the total number of transactions in the wallet */
    txcount: number
    /* the UNIX epoch time of the oldest pre-generated key in the key pool. Legacy wallets only. */
    keypoololdest: number
    /* how many new keys are pre-generated (only counts external keys) */
    keypoolsize: number
    /* how many new keys are pre-generated for internal use (used for change outputs, only appears if the wallet is using this feature, otherwise external keys are used) */
    keypoolsize_hd_internal: number
    /* the UNIX epoch time until which the wallet is unlocked for transfers, or 0 if the wallet is locked (only present for passphrase-encrypted wallets) */
    unlocked_until?: number
    /* the transaction fee configuration, set in BTC/kvB */
    paytxfee: string
    /* the Hash160 of the HD seed (only present when HD is enabled) */
    hdseedid?: string
    /* false if privatekeys are disabled for this wallet (enforced watch-only wallet) */
    private_keys_enabled: boolean
    /* whether this wallet tracks clean/dirty coins in terms of reuse */
    avoid_reuse: boolean
    /* current scanning details, or false if no scan is in progress */
    scanning: GetwalletinfoScanning
    /* whether this wallet uses descriptors for scriptPubKey management */
    descriptors: boolean
  }
}
