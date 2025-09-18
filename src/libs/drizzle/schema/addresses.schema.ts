import { relations } from 'drizzle-orm'
import { boolean, index, integer, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

import { sharedTimestampConumns } from '../utils'
import { wallets } from './wallets.schema'

export const addresses = pgTable(
  'addresses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    walletId: uuid('wallet_id')
      .notNull()
      .references(() => wallets.id, { onDelete: 'cascade' }),
    type: text('type').notNull().$type<'receive' | 'change'>(),
    purpose: integer('purpose').notNull().$type<Purpose>(),
    index: integer('index').notNull(),
    address: text('address').unique().notNull(),
    isUsed: boolean('is_used').notNull().default(false),
    ...sharedTimestampConumns
  },
  (self) => [
    index('address_wallet_index').on(self.walletId),
    index('address_type_index').on(self.type),
    index('address_purpose_index').on(self.purpose),
    uniqueIndex('address_address_unique_index').on(self.address)
  ]
).enableRLS()

// ********************** Relations ********************** \\

export const addressesRelations = relations(addresses, ({ one, many }) => ({
  wallet: one(wallets, {
    fields: [addresses.walletId],
    references: [wallets.id]
  })
}))
