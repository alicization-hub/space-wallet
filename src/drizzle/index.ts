import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import { DATABASE_URL } from "@/constants/env"

import { relations, schema } from "./relations"

const queryClient = postgres(DATABASE_URL, { idle_timeout: 30 })

export const db = drizzle({
  client: queryClient,
  relations,
  logger: false
})

export { schema }
