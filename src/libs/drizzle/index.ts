import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import { DB } from '@/constants/env'

import * as accounts from './schema/accounts.schema'
import * as addresses from './schema/addresses.schema'
import * as preferences from './schema/preferences.schema'
import * as wallets from './schema/wallets.schema'

const pool = new Pool({
  host: DB.host,
  port: Number(DB.port),
  database: DB.name,
  user: DB.user,
  password: DB.password,
  ssl: false
})

export const schema = Object.freeze({
  ...accounts,
  ...addresses,
  ...preferences,
  ...wallets
})

export const db = drizzle({
  client: pool,
  schema,
  logger: false,
  casing: 'camelCase'
})
