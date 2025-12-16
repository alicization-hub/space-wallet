import { getTableColumns } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import { DATABASE_URL } from '@/constants/env'

import * as accounts from './schema/accounts.schema'
import * as addresses from './schema/addresses.schema'
import * as relations from './schema/relations.schema'
import * as wallets from './schema/wallets.schema'

/**
 * @link https://node-postgres.com/apis/pool
 */
const pool = new Pool({ connectionString: DATABASE_URL, allowExitOnIdle: true })

export const schema = Object.freeze({
  ...wallets,
  ...accounts,
  ...addresses,
  ...relations
})

export const db = drizzle({
  client: pool,
  schema,
  logger: false,
  casing: 'snake_case'
})

export const walletColumns = getTableColumns(schema.wallets)
export const accountColumns = getTableColumns(schema.accounts)
export const balanceColumns = getTableColumns(schema.balances)
export const addressColumns = getTableColumns(schema.addresses)
