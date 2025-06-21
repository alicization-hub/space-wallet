import { relations } from 'drizzle-orm'
import { boolean, integer, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

import { sharedTimestampConumns } from '../utils'
import { accounts } from './accounts.schema'

export const addresses = pgTable(
  'addresses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    accountId: uuid('account_id')
      .references(() => accounts.id)
      .notNull(),
    label: text('label').notNull(),
    address: text('address').unique().notNull(),
    path: text('path').unique().notNull(),
    type: text('type').notNull().$type<'receive' | 'change'>(),
    index: integer('index').notNull(),
    isUsed: boolean('is_used').notNull().default(false),
    ...sharedTimestampConumns
  },
  (self) => [uniqueIndex().on(self.address)]
).enableRLS()

// ********************** Relations ********************** \\

export const addressesRelations = relations(addresses, ({ one, many }) => ({
  account: one(accounts, {
    fields: [addresses.accountId],
    references: [accounts.id]
  })
}))
