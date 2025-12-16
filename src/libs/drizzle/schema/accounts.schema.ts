import { boolean, index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

import { sharedTimestampConumns } from '../utils'
import { wallets } from './wallets.schema'

export const accounts = pgTable(
  'accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    walletId: uuid('wallet_id')
      .notNull()
      .references(() => wallets.id, { onDelete: 'restrict' }),
    label: text('label').unique().notNull(),
    purpose: integer('purpose').notNull().$type<Purpose>().default(84),
    index: integer('index').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    startedAt: timestamp('started_at', { precision: 6, withTimezone: true }).notNull().defaultNow(),
    ...sharedTimestampConumns
  },
  (self) => [
    uniqueIndex('account_label_unique_index').on(self.label),
    index('account_purpose_index').on(self.purpose),
    index('account_index_index').on(self.index)
  ]
).enableRLS()

export const balances = pgTable(
  'balances',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'restrict' }),
    confirmed: integer('confirmed').notNull().default(0),
    unconfirmed: integer('unconfirmed').notNull().default(0),
    immature: integer('immature').notNull().default(0),
    total: integer('total').notNull().default(0),
    spendable: integer('spendable').notNull().default(0),
    ...sharedTimestampConumns
  },
  (self) => [index('balance_account_index').on(self.accountId)]
).enableRLS()
