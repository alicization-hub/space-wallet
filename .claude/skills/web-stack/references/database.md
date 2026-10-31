# Database — Drizzle ORM + Postgres

Drizzle ORM 0.45 with the `pg` driver. Client in `src/drizzle/index.ts`, schema in
`src/drizzle/schema/*.schema.ts`, migrations in `src/drizzle/migrations/`.

## Tables

```
wallets ──< accounts ──< addresses
```

| Table       | Holds                                                                                                                                                                   |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wallets`   | `slug` (the name scripts use), `name`, `bio` (encrypted seed), `passkey` (argon2), `isActive`                                                                           |
| `accounts`  | One per BIP-44 purpose and index: `purpose` (84 / 86), `index`, `balance` (jsonb, sats), `startedAt` (rescan point). Its ID is also the name of its Bitcoin Core wallet |
| `addresses` | One row per derived address: `type` (`receive` / `change`), `index`, `address`, `isUsed`                                                                                |

- `accounts.label` is unique across wallets, so include the wallet's slug in it.
- Row-level security is enabled with no policies, which blocks everyone except the table
  owner and superusers. The app must connect as the owner.

## Secrets

`wallets.bio` and `wallets.passkey` are the two most sensitive columns. Read them only
where they're needed, and on purpose:

```ts
db.select(pick(["bio", "passkey"], walletColumns)) // createTransaction only
db.select(omit(["bio", "passkey"], walletColumns)) // everything else
```

Never `db.select()` a whole `wallets` row in code that returns to the client.

## Queries

- Reference tables as `schema.wallets`, and pick columns with ramda over the sets exported
  from `@/drizzle` (`walletColumns`, `accountColumns`, `addressColumns`).
- Always scope by the owner: `eq(schema.accounts.walletId, wallet.id)`. An ID from the
  client is never enough on its own.
- `withPagination(queryBuilder, page, take)` for lists.
- Group related writes in `db.transaction`. A wallet, its accounts, and its addresses go
  in together.

## Scripts

| Command                    | What it does                                             |
| -------------------------- | -------------------------------------------------------- |
| `bun run drizzle:generate` | Writes a migration from schema changes. No DB connection |
| `bun run drizzle:migrate`  | Applies migrations                                       |
| `bun run drizzle:push`     | Syncs the schema directly                                |
| `bun run drizzle:studio`   | Database browser on port 8337                            |

**Never run `migrate` or `push` against the real database yourself.** It holds the
encrypted seeds. Generate the migration, read the SQL, and tell the owner what to run. A
column dropped by accident can be the only copy of a seed.

The real database may have been created with `push`, so it may not have Drizzle's
migration table, and `migrate` would then try to run `0000` again. Check with the owner
before relying on either.

Prefer a schema that doesn't need a migration when one is enough. Any `select *` on a
table fails as soon as the code knows a column the database doesn't have, so a change must
ship together with its migration.
