import { getColumns } from "drizzle-orm"

import { accounts } from "./schema/accounts.schema"
import { addresses } from "./schema/addresses.schema"
import { wallets } from "./schema/wallets.schema"

export const walletColumns = getColumns(wallets)
export const accountColumns = getColumns(accounts)
export const addressColumns = getColumns(addresses)
