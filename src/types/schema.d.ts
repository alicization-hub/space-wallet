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
  export type Type = 'send' | 'receive' | 'generate' | 'immature' | 'orphan'
  export type Status = 'pending' | 'confirmed' | 'abandoned'

  export type Schema = {
    txid: string
    size: number
    version: number
    lockTime: number
    weight: number
    fee: number
    inputs: Array<Input>
    outputs: Array<Output>
    type: Type
    status: Status
    timestamp: number
    confirmations: number
    blockHash?: string
    blockHeight?: number
    blockIndex?: number
    blockTime?: number
  }

  export type Input = {
    txid: string
    address: string
    value: number
  }

  export type Output = {
    address: string
    value: number
  }
}
