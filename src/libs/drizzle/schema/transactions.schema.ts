import { relations } from 'drizzle-orm'
import { integer, json, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { v7 as uuidV7 } from 'uuid'

import { sharedTimestampConumns } from '../utils'
import { accounts } from './accounts.schema'

export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').primaryKey().default(uuidV7()),
    accountId: uuid('account_id')
      .references(() => accounts.id)
      .notNull(),
    txid: text('txid').notNull(),
    size: integer('size').notNull(),
    weight: integer('weight').notNull(),
    amount: integer('amount').notNull(),
    fee: integer('fee').notNull(),
    type: text('type').notNull().$type<Transaction.Type>(),
    status: text('status').notNull().$type<Transaction.Status>(),
    inputs: json('inputs').notNull().$type<Transaction.Input[]>(),
    outputs: json('outputs').notNull().$type<Transaction.Output[]>(),
    timestamp: timestamp('timestamp', { precision: 6, withTimezone: true }).notNull(),
    confirmations: integer('confirmations').notNull().default(0),
    blockHash: text('block_hash'),
    blockHeight: integer('block_height'),
    blockIndex: integer('block_index'),
    blockTime: integer('block_time'),
    ...sharedTimestampConumns
  },
  (self) => [uniqueIndex().on(self.txid)]
).enableRLS()

// ********************** Relations ********************** \\

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id]
  })
}))
