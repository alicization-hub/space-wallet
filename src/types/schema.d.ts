declare namespace Schema {
  export type Table = 'wallets' | 'accounts' | 'addresses' | 'transactions'
}

declare namespace Wallet {
  export type Schema = {
    id: UUID
    slug: string
    name: string
    mnemonic: string
    passphrase: string
    passkey: string
    accounts: Account.Schema[]
    balance: Balance
    lastSyncHeight: number
    /** Start scan data. */
    timestamp: string | null
    createdAt: string
    updatedAt?: string | null
  }

  /**
   * Unit in satoshi.
   */
  export type Balance = {
    /** Confirmed amount. */
    confirmed: number
    /** Pending/Unconfirmed amount. */
    unconfirmed: number
    /** Immature amount. */
    immature: number
    /** Total amount. */
    total: number
    /** Actually spendable amount */
    spendable: number
  }
}

declare namespace Account {
  export type Schema = {
    walletId: Wallet.Schema['id']
    id: UUID
    purpose: 44 | 84 | 86
    coinType: number
    index: number
    addresses: Address[]
    utxos: UTXO[]
    createdAt: string
    updatedAt?: string | null
  }

  export type Address = {
    accountId: Account.Schema['id']
    address: string
    path: string
    type: 'receive' | 'change'
    index: number
    balance: number
    isUsed: boolean
    createdAt: string
    updatedAt?: string | null
  }

  export type UTXO = {
    accountId: Account.Schema['id']
    txid: string
    vout: number
    /** Unit in satoshi. */
    amount: number
    address: string
    derivationPath: string
    /** Hex string */
    scriptPubKey: string
    confirmations: number
    /** `true` if the UTXO is spent */
    spent: boolean
    /** txid of the transaction that spent the UTXO */
    spendTxid?: string
    createdAt: string
    updatedAt: string
  }
}

declare namespace Transaction {
  export type Type = 'in' | 'out'
  export type Status = 'pending' | 'confirmed'

  export type Schema = {
    accountId: Account['id']
    txid: string
    status: Status
    confirmations: number
    /** Unix timestamp (block time) */
    timestamp: number
    /** Unit in satoshi */
    fee: number
    /** Virtual bytes (vbytes) */
    size: number
    inputs: {
      address: string
      amount: number
      path?: string
    }[]
    outputs: {
      address: string
      amount: number
      isChange: boolean
      path?: string
    }[]
  }
}
