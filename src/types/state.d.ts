declare namespace WebState {
  export type Wallet = Omit<
    Wallet.Schema,
    'slug' | 'mnemonic' | 'passphrase' | 'passkey' | 'accounts' | 'timestamp'
  >

  export type Account = Omit<
    Wallet.Account,
    'walletId' | 'purpose' | 'coinType' | 'index' | 'addresses' | 'utxos'
  >

  export type Address = Omit<Wallet.Address, 'accountId' | 'path' | 'index'>

  export type UTXO = Omit<Wallet.UTXO, 'accountId' | 'vout' | 'derivationPath' | 'scriptPubKey' | 'spendTxid'>
}
