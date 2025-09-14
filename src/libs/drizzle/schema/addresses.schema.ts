import { relations } from 'drizzle-orm'
import { boolean, index, integer, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

import { sharedTimestampConumns } from '../utils'
import { accounts } from './accounts.schema'

export const addresses = pgTable(
  'addresses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    label: text('label'),
    address: text('address').unique().notNull(),
    type: text('type').notNull().$type<'receive' | 'change'>(),
    index: integer('index').notNull(),
    isUsed: boolean('is_used').notNull().default(false),
    ...sharedTimestampConumns
  },
  (self) => [
    index('address_account_index').on(self.accountId),
    uniqueIndex('address_address_unique_index').on(self.address)
  ]
).enableRLS()

// ********************** Relations ********************** \\

export const addressesRelations = relations(addresses, ({ one, many }) => ({
  account: one(accounts, {
    fields: [addresses.accountId],
    references: [accounts.id]
  })
}))
