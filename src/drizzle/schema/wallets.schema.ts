import { boolean, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core"

import { sharedTimestampColumns } from "../utils"

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
    uniqueIndex("wallet_name_unique_index").on(self.name)
  ]
)
