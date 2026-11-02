import { sql } from "drizzle-orm"
import {
  boolean,
  check,
  integer,
  jsonb,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core"

import { sharedTimestampColumns } from "../utils"
import { webRole } from "./roles.schema"
import { wallets } from "./wallets.schema"

export const accounts = pgTable.withRLS(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    walletId: uuid("wallet_id")
      .notNull()
      .references(() => wallets.id, { onDelete: "restrict" }),
    label: text("label").notNull(),
    purpose: integer("purpose").notNull().$type<Purpose>(),
    index: integer("index").notNull(),
    balance: jsonb("balance").notNull().$type<Account.Balance>().default({
      confirmed: 0,
      unconfirmed: 0,
      immature: 0,
      total: 0,
      spendable: 0
    }),
    isActive: boolean("is_active").notNull().default(true),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    ...sharedTimestampColumns
  },
  (self) => [
    uniqueIndex("account_label_unique_index").on(self.label),
    uniqueIndex("account_wallet_path_unique_index").on(
      self.walletId,
      self.purpose,
      self.index
    ),
    check("account_purpose_check", sql`${self.purpose} in (84, 86)`),
    check("account_index_check", sql`${self.index} >= 0`),
    pgPolicy("account_web_read", { for: "select", to: webRole, using: sql`true` }),
    pgPolicy("account_web_update", {
      for: "update",
      to: webRole,
      using: sql`true`,
      withCheck: sql`true`
    })
  ]
)
