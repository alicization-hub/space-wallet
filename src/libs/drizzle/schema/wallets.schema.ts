import { relations } from 'drizzle-orm'
import { pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { v7 as uuidV7 } from 'uuid'

import { sharedTimestampConumns } from '../utils'
import { accounts } from './accounts.schema'

export const wallets = pgTable(
  'wallets',
  {
    id: uuid('id').primaryKey().default(uuidV7()),
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
  accounts: many(accounts)
}))
