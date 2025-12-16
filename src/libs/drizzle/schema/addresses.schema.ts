import { boolean, index, integer, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

import { sharedTimestampConumns } from '../utils'
import { accounts } from './accounts.schema'

export const addresses = pgTable(
  'addresses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'restrict' }),
    label: text('label'),
    type: text('type').notNull().$type<'receive' | 'change'>(),
    index: integer('index').notNull().default(0),
    address: text('address').unique().notNull(),
    isUsed: boolean('is_used').notNull().default(false),
    ...sharedTimestampConumns
  },
  (self) => [
    index('address_account_index').on(self.accountId),
    index('address_type_index').on(self.type),
    index('address_index_index').on(self.index),
    uniqueIndex('address_address_unique_index').on(self.address)
  ]
).enableRLS()
