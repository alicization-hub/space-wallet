declare type TransactionDetail = {
  /** Only returns true if imported addresses were involved in transaction. */
  involvesWatchonly: boolean
  /** The bitcoin address involved in the transaction. */
  address: string
  /**
   * The transaction category.
   * "send"                  Transactions sent.
   * "receive"               Non-coinbase transactions received.
   * "generate"              Coinbase transactions received with more than 100 confirmations.
   * "immature"              Coinbase transactions received with 100 or fewer confirmations.
   * "orphan"                Orphaned coinbase transactions received.
   */
  category: string
  /** The amount in BTC */
  amount: string
  /** A comment for the address/transaction, if any */
  label: string
  /** the vout value */
  vout: number
  /**
   * The amount of the fee in BTC. This is negative and only available for the
   * 'send' category of transactions.
   */
  fee: string
  /**
   * 'true' if the transaction has been abandoned (inputs are respendable). Only available for the
   * 'send' category of transactions.
   */
  abandoned: boolean
}

declare type TransactionResult = {
  /** The amount in BTC */
  amount: string
  /**
   * The amount of the fee in BTC. This is negative and only available for the
   * 'send' category of transactions.
   */
  fee: string
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
  details: TransactionDetail[]
  /** Raw data for transaction */
  hex: string
  /** Optional, the decoded transaction (only present when `verbose` is passed) */
  decoded: Dict<string | boolean | number | object>
} & {
  /**
   * ("yes|no|unknown") Whether this transaction could be replaced due to BIP125 (replace-by-fee);
   * may be unknown for unconfirmed transactions not in the mempool
   */
  'bip125-replaceable': string
}
