import { type InferInsertModel, type InferSelectModel } from 'drizzle-orm'

import { accounts, balances } from './schema/accounts.schema'
import { addresses } from './schema/addresses.schema'
import { wallets } from './schema/wallets.schema'

type OmitColumns = 'id' | 'createdAt' | 'updatedAt'

export type Wallet = InferSelectModel<typeof wallets>
export type WalletInsertValues = Omit<InferInsertModel<typeof wallets>, OmitColumns>
export type WalletUpdateValues = Partial<WalletInsertValues>

export type Account = InferSelectModel<typeof accounts>
export type AccountInsertValues = Omit<InferInsertModel<typeof accounts>, OmitColumns>
export type AccountUpdateValues = Partial<AccountInsertValues>

export type Balance = InferSelectModel<typeof balances>
export type BalanceInsertValues = Omit<InferInsertModel<typeof balances>, OmitColumns>
export type BalanceUpdateValues = Partial<BalanceInsertValues>

export type Address = InferSelectModel<typeof addresses>
export type AddressInsertValues = Omit<InferInsertModel<typeof addresses>, OmitColumns>
export type AddressUpdateValues = Partial<AddressInsertValues>

export namespace Schema {
  export type IWallet = Omit<Wallet, 'bio' | 'passkey'>
  export type IAccount = Omit<Account, 'walletId'>
  export type IBalance = Omit<Balance, 'accountId'>
  export type IAddress = Omit<Address, 'accountId'>
}
