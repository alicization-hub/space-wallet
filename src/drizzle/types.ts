import type { InferInsertModel, InferSelectModel } from "drizzle-orm"

import { accounts } from "./schema/accounts.schema"
import { addresses } from "./schema/addresses.schema"
import { wallets } from "./schema/wallets.schema"

export type Wallet = InferSelectModel<typeof wallets>
export type WalletInsertValues = InferInsertModel<typeof wallets>
export type WalletUpdateValues = Partial<WalletInsertValues>

export type Account = InferSelectModel<typeof accounts>
export type AccountInsertValues = InferInsertModel<typeof accounts>
export type AccountUpdateValues = Partial<AccountInsertValues>

export type Address = InferSelectModel<typeof addresses>
export type AddressInsertValues = InferInsertModel<typeof addresses>
export type AddressUpdateValues = Partial<AddressInsertValues>
