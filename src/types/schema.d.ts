declare namespace Wallet {
  export type Balance = {
    confirmed: number
    unconfirmed: number
    immature: number
    total: number
    spendable: number
  }
}

declare namespace Transaction {
  export type Type = 'send' | 'receive' | 'generate' | 'immature' | 'orphan'
  export type Status = 'pending' | 'confirmed' | 'abandoned'

  export type Input = {
    txid: string
    address: string
    value: number
  }

  export type Output = {
    address: string
    value: number
  }

  export type PrepareInput<T extends string> = T extends 'client'
    ? Pick<Unspent.List, 'txid' | 'vout' | 'address' | 'amount' | 'confirmations' | 'spendable'>
    : Pick<Unspent.List, 'txid' | 'vout' | 'address' | 'amount' | 'scriptPubKey'> & {
        type: 'wpkh' | 'tr'
        derivationPath: string
      }

  export type PrepareOutput = {
    address: string
    /** Amount in BTC */
    amount: number
    isRecipient: boolean
    isChange: boolean
  }
}
