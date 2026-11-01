import { sql } from "drizzle-orm"
import {
  boolean,
  check,
  integer,
  pgTable,
  text,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core"

import { sharedTimestampColumns } from "../utils"
import { accounts } from "./accounts.schema"

export const addresses = pgTable.withRLS(
  "addresses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    label: text("label"),
    type: text("type").notNull().$type<"receive" | "change">(),
    index: integer("index").notNull(),
    address: text("address").notNull(),
    isUsed: boolean("is_used").notNull().default(false),
    ...sharedTimestampColumns
  },
  (self) => [
    uniqueIndex("address_address_unique_index").on(self.address),
    uniqueIndex("address_path_unique_index").on(self.accountId, self.type, self.index),
    check("address_type_check", sql`${self.type} in ('receive', 'change')`),
    check("address_index_check", sql`${self.index} >= 0`)
  ]
)
