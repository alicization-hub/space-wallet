import { accounts } from './schema/accounts.schema'
import { addresses } from './schema/addresses.schema'
import { wallets } from './schema/wallets.schema'

export type WalletSchema = typeof wallets.$inferSelect
export type AccountSchema = typeof accounts.$inferSelect
export type AddressSchema = typeof addresses.$inferSelect

export namespace WebState {
  export type Wallet = Omit<WalletSchema, 'bio' | 'passkey'>
  export type Account = Omit<AccountSchema, 'walletId' | 'index' | 'lastDescriptorRange'>
  export type Address = Omit<AddressSchema, 'accountId'>
}
