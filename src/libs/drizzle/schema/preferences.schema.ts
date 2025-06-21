import { relations } from 'drizzle-orm'
import { integer, pgTable, text, uuid } from 'drizzle-orm/pg-core'

import { sharedTimestampConumns } from '../utils'
import { wallets } from './wallets.schema'

export const preferences = pgTable(
  'preferences',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    walletId: uuid('wallet_id')
      .references(() => wallets.id)
      .notNull(),
    gapLimit: integer('gap_limit').notNull().default(20),
    ...sharedTimestampConumns
  },
  (self) => []
).enableRLS()

// ********************** Relations ********************** \\

export const preferencesRelations = relations(preferences, ({ one, many }) => ({
  wallet: one(wallets, {
    fields: [preferences.walletId],
    references: [wallets.id]
  })
}))
