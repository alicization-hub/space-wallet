import { defineConfig } from 'drizzle-kit'

import { DATABASE_URL } from '@/constants/env'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/libs/drizzle/schema/*.schema.ts',
  out: './src/libs/drizzle/migrations',
  dbCredentials: {
    url: DATABASE_URL
  },
  introspect: {
    casing: 'camel'
  }
})
