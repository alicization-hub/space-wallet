import { defineConfig } from 'drizzle-kit'

import { DB } from '@/constants/env'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/libs/drizzle/schema/*.schema.ts',
  out: './src/libs/drizzle/migrations',
  dbCredentials: {
    host: DB.host,
    port: Number(DB.port),
    database: DB.name,
    user: DB.user,
    password: DB.password,
    ssl: false
  },
  introspect: {
    casing: 'camel'
  }
})
