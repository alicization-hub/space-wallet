declare namespace Unspent {
  export type List = {
    /** the transaction id */
    txid: string
    /** the vout value */
    vout: number
    /** the bitcoin address */
    address: string
    /** The associated label, or "" for the default label */
    label: string
    /** the script key */
    scriptPubKey: string
    /** the transaction output amount in BTC */
    amount: string
    /** The number of confirmations */
    confirmations: number
    /** The redeemScript if scriptPubKey is P2SH */
    redeemScript: string
    /** witnessScript if the scriptPubKey is P2WSH or P2SH-P2WSH */
    witnessScript: string
    /** Whether we have the private keys to spend this output */
    spendable: boolean
    /** Whether we know how to spend this output, ignoring the lack of keys */
    solvable: boolean
    /** (only present if avoid_reuse is set) Whether this output is reused/dirty (sent to an address that was previously spent from) */
    reused: boolean
    /** (only when solvable) A descriptor for spending this output */
    desc: string
    /**
     * Whether this output is considered safe to spend. Unconfirmed transactions
     * from outside keys and unconfirmed replacement transactions are considered unsafe
     * and are not eligible for spending by fundrawtransaction and sendtoaddress.
     */
    safe: boolean
  }

  export type QueryOptions = {
    /** Minimum value of each UTXO in BTC */
    minimumAmount?: number | string
    /** Maximum value of each UTXO in BTC */
    maximumAmount?: number | string
    /** Maximum number of UTXOs */
    maximumCount?: number
    /** Minimum sum value of all UTXOs in BTC */
    minimumSumAmount?: number | string
  }
}
