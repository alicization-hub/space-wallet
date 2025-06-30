declare namespace ITransaction {
  export type List = {
    /** Only returns true if imported addresses were involved in transaction. */
    involvesWatchonly: boolean
    /** The bitcoin address of the transaction. */
    address: string
    /**
     * The transaction category.
     * ```
     * "send" Transactions sent.
     * "receive" Non-coinbase transactions received.
     * "generate" Coinbase transactions received with more than 100 confirmations.
     * "immature" Coinbase transactions received with 100 or fewer confirmations.
     * "orphan" Orphaned coinbase transactions received.
     * ```
     */
    category: string
    /**
     * The amount in BTC.
     * This is negative for the 'send' category, and is positive for all other categories
     */
    amount: number
    /** A comment for the address/transaction, if any */
    label: string
    /** the vout value */
    vout: number
    /**
     * The amount of the fee in BTC.
     * This is negative and only available for the 'send' category of transactions.
     */
    fee: number
    /**
     * The number of confirmations for the transaction. Negative confirmations means the
     * transaction conflicted that many blocks ago.
     */
    confirmations: number
    /** Only present if transaction only input is a coinbase one. */
    generated: boolean
    /** Only present if we consider transaction to be trusted and so safe to spend from. */
    trusted: boolean
    /** The block hash containing the transaction. */
    blockhash: string
    /** The block height containing the transaction. */
    blockheight: number
    /** The index of the transaction in the block that includes it. */
    blockindex: number
    /** The block time expressed in UNIX epoch time. */
    blocktime: number
    /** The transaction id. */
    txid: string
    /** Conflicting transaction ids. */
    walletconflicts: string[]
    /** The transaction time expressed in UNIX epoch time. */
    time: number
    /** The time received expressed in UNIX epoch time. */
    timereceived: number
    /** If a comment is associated with the transaction, only present if not empty. */
    comment: string
    /**
     * 'true' if the transaction has been abandoned (inputs are respendable).
     * Only available for the 'send' category of transactions.
     * */
    abandoned: boolean
  } & {
    /**
     * ("yes|no|unknown") Whether this transaction could be replaced due to BIP125 (replace-by-fee);
     * may be unknown for unconfirmed transactions not in the mempool
     */
    'bip125-replaceable': string
  }

  export type Raw = {
    /**
     * Whether specified block is in the active chain or not (only present with explicit "blockhash"
     * argument)
     */
    in_active_chain: boolean
    /** The serialized, hex-encoded data for 'txid' */
    hex: string
    /** The transaction id (same as provided) */
    txid: string
    /** The transaction hash (differs from txid for witness transactions) */
    hash: string
    /** The serialized transaction size */
    size: number
    /** The virtual transaction size (differs from size for witness transactions) */
    vsize: number
    /** The transaction's weight (between vsize*4-3 and vsize*4) */
    weight: number
    /** The version */
    version: number
    /** The lock time */
    locktime: number
    vin: Vin[]
    vout: Vout[]
    /** the block hash */
    blockhash: string
    /** The confirmations */
    confirmations: number
    /** The block time expressed in UNIX epoch time */
    blocktime: number
    /** Same as "blocktime" */
    time: number
  }

  export type Vin = {
    /** The transaction id */
    txid: string
    /** The output number */
    vout: number
    /** The script */
    scriptSig: VinScriptSig
    /** The script sequence number */
    sequence: number
    /** hex-encoded witness data */
    txinwitness: string[]
  }

  export type VinScriptSig = {
    /** asm */
    asm: string
    /** hex */
    hex: string
  }

  export type Vout = {
    /** The value in BTC */
    value: number
    /** index */
    n: number
    scriptPubKey: VoutScriptPubKey
  }

  export type VoutScriptPubKey = {
    /** the asm */
    asm: string
    /** the descriptor */
    desc: string
    /** the hex */
    hex: string
    /** The type, eg 'pubkeyhash' */
    type: string
    /** bitcoin address (only if a well-defined address exists) */
    address?: string
  }
}
