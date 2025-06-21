declare namespace Wallet {
  export type Schema = {
    id: UUID
    slug: string
    name: string
    bio: string
    passkey: string
    createdAt: string
    updatedAt?: string | null
  }

  export type Account = {
    walletId: Schema['id']
    id: UUID
    label: string
    purpose: 84 | 86
    index: number
    balance: Balance
    lastSyncHeight: number
    startedAt: string
    createdAt: string
    updatedAt?: string | null
  }

  export type Address = {
    accountId: Account['id']
    label: string
    address: string
    path: string
    type: 'receive' | 'change'
    index: number
    isUsed: boolean
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
