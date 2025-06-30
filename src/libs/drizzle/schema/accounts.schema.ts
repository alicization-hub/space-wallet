import { relations } from 'drizzle-orm'
import { boolean, index, integer, json, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { sharedTimestampConumns } from '../utils'
import { addresses } from './addresses.schema'
import { transactions } from './transactions.schema'
import { wallets } from './wallets.schema'

export const accounts = pgTable(
  'accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    walletId: uuid('wallet_id')
      .references(() => wallets.id)
      .notNull(),
    label: text('label').notNull(),
    purpose: integer('purpose').notNull().$type<84 | 86>(),
    index: integer('index').notNull(),
    balance: json('balance').notNull().$type<Wallet.Balance>(),
    lastSyncHeight: integer('last_sync_height').notNull(),
    lastDescriptorRange: integer('last_descriptor_range').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    startedAt: timestamp('started_at', { precision: 6, withTimezone: true }).notNull().defaultNow(),
    ...sharedTimestampConumns
  },
  (self) => [index().on(self.label)]
).enableRLS()

// ********************** Relations ********************** \\

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  wallet: one(wallets, {
    fields: [accounts.walletId],
    references: [wallets.id]
  }),
  addresses: many(addresses),
  transactions: many(transactions)
}))
