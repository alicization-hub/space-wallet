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
    balance: jsonb('balance').notNull().$type<Account.Balance>().default({
      confirmed: 0,
      unconfirmed: 0,
      immature: 0,
      total: 0,
      spendable: 0
    }),
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
