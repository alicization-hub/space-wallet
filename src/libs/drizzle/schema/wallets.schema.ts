import { relations } from 'drizzle-orm'
import { boolean, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

import { sharedTimestampConumns } from '../utils'
import { accounts } from './accounts.schema'

export const wallets = pgTable(
  'wallets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').unique().notNull(),
    name: text('name').unique().notNull(),
    bio: text('bio').unique().notNull(),
    passkey: text('passkey').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    ...sharedTimestampConumns
  },
  (self) => [uniqueIndex().on(self.slug)]
).enableRLS()

// ********************** Relations ********************** \\

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  accounts: many(accounts)
}))
