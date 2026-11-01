import { defineRelations } from "drizzle-orm"

import * as accounts from "./schema/accounts.schema"
import * as addresses from "./schema/addresses.schema"
import * as wallets from "./schema/wallets.schema"

export const schema = Object.freeze({ ...wallets, ...accounts, ...addresses })

export const relations = defineRelations(schema, (r) => ({
  wallets: {
    accounts: r.many.accounts()
  },
  accounts: {
    wallet: r.one.wallets({
      from: r.accounts.walletId,
      to: r.wallets.id,
      optional: false
    }),
    addresses: r.many.addresses()
  },
  addresses: {
    account: r.one.accounts({
      from: r.addresses.accountId,
      to: r.accounts.id,
      optional: false
    })
  }
}))
