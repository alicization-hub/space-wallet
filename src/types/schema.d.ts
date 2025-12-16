declare namespace Transaction {
  export type Type = 'send' | 'receive' | 'generate' | 'immature' | 'orphan'
  export type Status = 'pending' | 'confirmed' | 'abandoned'

  export type Schema = {
    txid: string
    size: number
    weight: number
    amount: number
    fee: number
    type: Type
    status: Status
    inputs: Array<{
      txid: string
      address: string
      value: number
    }>
    outputs: Array<{
      address: string
      value: number
    }>
    timestamp: Date
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
