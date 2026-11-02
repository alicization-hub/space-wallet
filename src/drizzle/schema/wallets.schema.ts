import { sql } from "drizzle-orm"
import { boolean, pgPolicy, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core"

import { sharedTimestampColumns } from "../utils"
import { webRole } from "./roles.schema"

export const wallets = pgTable.withRLS(
  "wallets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    bio: text("bio").notNull(),
    passkey: text("passkey").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    ...sharedTimestampColumns
  },
  (self) => [
    uniqueIndex("wallet_slug_unique_index").on(self.slug),
    uniqueIndex("wallet_name_unique_index").on(self.name),
    pgPolicy("wallet_web_read", { for: "select", to: webRole, using: sql`true` })
  ]
)
