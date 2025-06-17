declare namespace Descriptor {
  export type Info = {
    /* The descriptor in canonical form, without private keys */
    descriptor: string
    /* The checksum for the input descriptor */
    checksum: string
    /* Whether the descriptor is ranged */
    isrange: boolean
    /*  Whether the descriptor is solvable */
    issolvable: boolean
    /* Whether the input descriptor contained at least one private key */
    hasprivatekeys: boolean
  }

  export type ImportRequest = {
    /**
     * Descriptor to import.
     * ```
     * P2WPKH = `wpkh([fp/84'/0'/0']xpub/0/*)`
     * Taproot = `tr(xonlypubkey)`
     * ```
     **/
    desc: string
    /* Set this descriptor to be the active descriptor for the corresponding output type/externality */
    active?: boolean
    /* If a ranged descriptor is used, this specifies the end or the range (in the form [begin,end]) to import */
    range: number[]
    /* If a ranged descriptor is set to active, this specifies the next index to generate addresses from */
    next_index?: number
    /**
     * Time from which to start rescanning the blockchain for this descriptor, in UNIX epoch time Use the string "now" to substitute the current synced blockchain time.
     * "now" can be specified to bypass scanning, for outputs which are known to never have been used, and 0 can be specified to scan the entire blockchain.
     * Blocks up to 2 hours before the earliest timestamp of all descriptors being imported will be scanned.
     **/
    timestamp: number | 'now'
    /* Whether matching outputs should be treated as not incoming payments (e.g. change) */
    internal?: boolean
    /* Label to assign to the address, only allowed with internal=false */
    label?: string
  }

  export type ImportResult = {
    success: boolean
    warnings?: string[]
    error?: Record<string, string | boolean | number | object>
  }
}
