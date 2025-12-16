import { relations } from 'drizzle-orm'

import { accounts, balances } from './accounts.schema'
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
  balances: one(balances, {
    fields: [accounts.id],
    references: [balances.accountId]
  }),
  addresses: many(addresses)
}))

export const balancesRelations = relations(balances, ({ one, many }) => ({
  account: one(accounts, {
    fields: [balances.accountId],
    references: [accounts.id]
  })
}))

export const addressesRelations = relations(addresses, ({ one, many }) => ({
  account: one(accounts, {
    fields: [addresses.accountId],
    references: [accounts.id]
  })
}))
