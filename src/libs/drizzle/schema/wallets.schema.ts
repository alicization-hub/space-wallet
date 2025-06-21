import { relations } from 'drizzle-orm'
import { pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

import { sharedTimestampConumns } from '../utils'
import { accounts } from './accounts.schema'
import { preferences } from './preferences.schema'

export const wallets = pgTable(
  'wallets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: text('slug').unique().notNull(),
    name: text('name').unique().notNull(),
    bio: text('bio').unique().notNull(),
    passkey: text('passkey').notNull(),
    ...sharedTimestampConumns
  },
  (self) => [uniqueIndex().on(self.slug)]
).enableRLS()

// ********************** Relations ********************** \\

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  accounts: many(accounts),
  preference: one(preferences, {
    fields: [wallets.id],
    references: [preferences.walletId]
  })
}))
