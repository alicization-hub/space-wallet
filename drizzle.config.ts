import { defineConfig } from "drizzle-kit"

import { DATABASE_URL } from "@/constants/env"

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/drizzle/schema/*.schema.ts",
  out: "./src/drizzle/migrations",
  // v1 manages every schema by default, and `push` offers to drop the ones it doesn't know
  schemaFilter: ["public"],
  dbCredentials: {
    url: DATABASE_URL
  },
  introspect: {
    casing: "camel"
  }
})
