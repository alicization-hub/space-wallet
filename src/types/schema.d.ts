declare namespace Schema {
  export type Table = 'wallets' | 'transactions'
}

declare namespace Wallet {
  export type Schema = {
    id: string
    slug: string
    name: string
    mnemonic: string
    passphrase: string
    passkey: string
    accounts: Account[]
    balance: Balance
    lastSyncHeight: number
    createdAt: string
    updatedAt?: string | null
  }

  export type Account = {
    id: string
    purpose: 44 | 84 | 86
    coinType: number
    index: number
    addresses?: Address[]
    utxos?: UTXO[]
    createdAt: string
    updatedAt?: string | null
  }

  export type Address = {
    accountId: Account['id']
    address: string
    index: number
    /* `0` = receive, `1` = change */
    change: 0 | 1
    type: 'pkh' | 'wpkh' | 'tr'
    /* Unit in satoshi. */
    balance: number
    hasUTXO?: boolean
    isUsed?: boolean
    createdAt: string
    updatedAt?: string | null
  }

  /**
   * Unit in satoshi.
   */
  export type Balance = {
    /* Confirmed amount. */
    confirmed: number
    /* Pending/Unconfirmed amount. */
    unconfirmed: number
    /* Immature amount. */
    immature: number
    /* Total amount. */
    total: number
    /* Actually spendable amount */
    spendable: number
  }

  export type UTXO = {
    accountId: Account['id']
    txid: string
    vout: number
    /* Unit in satoshi. */
    amount: number
    address: string
    derivationPath: string
    /* Hex string */
    scriptPubKey: string
    confirmations: number
    /* `true` if the UTXO is spent */
    spent: boolean
    /* txid of the transaction that spent the UTXO */
    spendTxid?: string
    createdAt: string
    updatedAt: string
  }

  export type TwoFA = {
    secretCode: string
    recoveryCodes: RecoveryCode[]
  }

  export type RecoveryCode = {
    /* argon2-hash of recovery code */
    hash: string
    used: boolean
    /* Date string */
    usedAt?: string
    /* Date string */
    createdAt: string
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
    /* Unix timestamp (block time) */
    timestamp: number
    /* Unit in satoshi */
    fee: number
    /* Virtual bytes (vbytes) */
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
