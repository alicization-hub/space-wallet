import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import { DATABASE_URL } from '@/constants/env'

import * as addresses from './schema/addresses.schema'
import * as transactions from './schema/transactions.schema'
import * as wallets from './schema/wallets.schema'

/**
 * @link https://node-postgres.com/apis/pool
 */
const pool = new Pool({ connectionString: DATABASE_URL, allowExitOnIdle: true })

export const schema = Object.freeze({
  ...addresses,
  ...transactions,
  ...wallets
})

export const db = drizzle({
  client: pool,
  schema,
  logger: false,
  casing: 'camelCase'
})
