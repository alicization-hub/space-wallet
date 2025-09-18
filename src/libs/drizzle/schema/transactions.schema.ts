import { relations } from 'drizzle-orm'
import { index, integer, json, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { sharedTimestampConumns } from '../utils'
import { wallets } from './wallets.schema'

export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    walletId: uuid('wallet_id')
      .notNull()
      .references(() => wallets.id, { onDelete: 'cascade' }),
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
    ...sharedTimestampConumns
  },
  (self) => [
    index('transaction_wallet_index').on(self.walletId),
    index('transaction_txid_index').on(self.txid)
  ]
).enableRLS()

// ********************** Relations ********************** \\

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  wallet: one(wallets, {
    fields: [transactions.walletId],
    references: [wallets.id]
  })
}))
