import { relations } from 'drizzle-orm'

import { accounts } from './accounts.schema'
import { addresses } from './addresses.schema'
import { wallets } from './wallets.schema'

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  accounts: many(accounts)
}))

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  wallet: one(wallets, {
    fields: [accounts.walletId],
    references: [wallets.id]
  }),
  addresses: many(addresses)
}))

export const addressesRelations = relations(addresses, ({ one, many }) => ({
  account: one(accounts, {
    fields: [addresses.accountId],
    references: [accounts.id]
  })
}))
