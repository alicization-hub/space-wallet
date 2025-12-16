import { boolean, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

import { sharedTimestampConumns } from '../utils'

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
  (self) => [
    uniqueIndex('wallet_slug_unique_index').on(self.slug),
    uniqueIndex('wallet_name_unique_index').on(self.name)
  ]
).enableRLS()
