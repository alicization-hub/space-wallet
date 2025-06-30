import { accounts } from './schema/accounts.schema'
import { addresses } from './schema/addresses.schema'
import { transactions } from './schema/transactions.schema'
import { wallets } from './schema/wallets.schema'

export type Wallet = typeof wallets.$inferSelect
export type Account = typeof accounts.$inferSelect
export type Address = typeof addresses.$inferSelect
export type Transaction = typeof transactions.$inferSelect

export namespace Schema {
  export type iWallet = Omit<Wallet, 'bio' | 'passkey'>
  export type iAccount = Omit<Account, 'walletId' | 'index' | 'lastDescriptorRange'>
  export type iAddress = Omit<Address, 'accountId'>
  export type iTransaction = Omit<Transaction, 'accountId'>
}
