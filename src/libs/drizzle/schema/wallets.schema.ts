import { relations } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from 'drizzle-orm/pg-core'

import { sharedTimestampConumns } from '../utils'
import { addresses } from './addresses.schema'
import { transactions } from './transactions.schema'

export const wallets = pgTable(
  'wallets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').unique().notNull(),
    name: text('name').unique().notNull(),
    bio: text('bio').unique().notNull(),
    passkey: text('passkey').notNull(),
    purpose: integer('purpose').array().notNull().$type<Purpose[]>().default([84, 86]),
    account: integer('index').array().notNull().default([0]),
    balance: jsonb('balance').notNull().$type<Wallet.Balance>(),
    isActive: boolean('is_active').notNull().default(true),
    lastDescriptorRange: integer('last_descriptor_range').notNull().default(0),
    startedAt: timestamp('started_at', { precision: 6, withTimezone: true }).notNull().defaultNow(),
    ...sharedTimestampConumns
  },
  (self) => [
    uniqueIndex('wallet_slug_unique_index').on(self.slug),
    index('wallet_purpose_index').on(self.purpose),
    index('wallet_account_index').on(self.account)
  ]
).enableRLS()

// ********************** Relations ********************** \\

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  addresses: many(addresses),
  transactions: many(transactions)
}))
