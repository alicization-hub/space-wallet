# Database — Drizzle ORM + Postgres

Drizzle ORM v1 release candidate with the `postgres` driver (postgres.js). Client in
`src/drizzle/index.ts`, schema in `src/drizzle/schema/*.schema.ts`, relations in
`src/drizzle/relations.ts`, column sets in `src/drizzle/table-columns.ts`, migrations in
`src/drizzle/migrations/`.

`drizzle-orm` and `drizzle-kit` are pinned to the same exact version (`1.0.0-rc.5`): a
caret on a release candidate would move to the next one by itself. Upgrade them together,
and read the [changes](https://orm.drizzle.team/docs/v0-v1-changes) first:

```sh
bun add --exact drizzle-orm@<version>
bun add -d --exact drizzle-kit@<version>
```

## v1, not 0.x

Most examples out there are 0.x. Don't use these forms:

| 0.x                                                 | v1                                                          |
| --------------------------------------------------- | ----------------------------------------------------------- |
| `relations(table, …)` for each table                | One `defineRelations(schema, (r) => …)`, with `from` / `to` |
| `drizzle({ client, schema })`                       | `drizzle({ client, relations })`                            |
| `getTableColumns(table)`                            | `getColumns(table)`                                         |
| `pgTable(…).enableRLS()`                            | `pgTable.withRLS(…)`                                        |
| `drizzle({ casing })`                               | Gone. Every column here spells out its DB name              |
| `db.query` with `where: (t, { eq }) => eq(t.id, 1)` | `where: { id: 1 }`. An explicit `undefined` throws          |
| `0000_name.sql` + `meta/_journal.json`              | `<timestamp>_<name>/migration.sql` + `snapshot.json`        |

The app reads through the select builder (`db.select()`). Nothing uses `db.query` yet.

## Tables

```
wallets ──< accounts ──< addresses
```

| Table       | Holds                                                                                                                                                                            |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wallets`   | `slug` (the name scripts use), `name`, `bio` (encrypted seed), `passkey` (argon2), `isActive`                                                                                    |
| `accounts`  | One per wallet, BIP-44 purpose, and index: `purpose` (84 / 86), `index`, `balance` (jsonb, sats), `startedAt` (rescan point). Its ID is also the name of its Bitcoin Core wallet |
| `addresses` | One row per derived address: `type` (`receive` / `change`), `index`, `address`, `isUsed`                                                                                         |

- `accounts.label` is unique across wallets, so include the wallet's slug in it.
- Row-level security is enabled with no policies (`pgTable.withRLS`), which blocks
  everyone except the table owner and superusers. The app must connect as the owner: any
  other role gets no rows and no error, so the app looks as if it has no wallets.

## Schema rules

- **The database enforces the derivation path.** One account per
  `(wallet_id, purpose, index)`, one address per `(account_id, type, index)`, one row per
  `address`. `purpose`, `type`, and `index` are limited by `check`, because `$type<…>()`
  only exists in TypeScript.
- **Path columns have no default.** A missing `purpose`, `type`, or `index` must fail, not
  save a row on the wrong path.
- **Unique keys are `uniqueIndex(…)`, never `.unique()`.** Having both builds two
  identical indexes. Names follow `<table>_<what>_unique_index` and
  `<table>_<what>_check`.
- **`bio` isn't unique, on purpose.** Its salt and nonce are random, so the same seed
  never gives the same value, and the index couldn't catch a duplicate.
  `addresses.address` does that. A violation would also put the ciphertext in the driver's
  `cause.detail`.
- **An index serves a query.** `address_path_unique_index` and
  `account_wallet_path_unique_index` also cover the foreign keys and what the app filters
  on. Don't add one on a single low-cardinality column like `type`, `purpose`, or
  `is_active`.
- **Foreign keys are `onDelete: "restrict"`.** Deleting a row must never take a wallet's
  accounts or addresses with it.

## Secrets

`wallets.bio` and `wallets.passkey` are the two most sensitive columns. Read them only
where they're needed, and on purpose:

```ts
db.select(pick(["bio", "passkey"], walletColumns)) // createTransaction only
db.select(omit(["bio", "passkey"], walletColumns)) // everything else
```

Never `db.select()` a whole `wallets` row in code that returns to the client.

Keep them out of logs too. Print a query error's `cause.message`, never its other fields:
the driver's `cause.parameters` holds every value of the statement, `bio` and `passkey`
included. Don't set `paramsInErrors` in `drizzle()`, which would put them in the message.

## Queries

- Reference tables as `schema.wallets`, and pick columns with ramda over the sets exported
  from `@/drizzle/table-columns` (`walletColumns`, `accountColumns`, `addressColumns`).
- Always scope by the owner: `eq(schema.accounts.walletId, wallet.id)`. An ID from the
  client is never enough on its own.
- `withPagination(queryBuilder, page, take)` for lists.
- Group related writes in `db.transaction`. A wallet, its accounts, and its addresses go
  in together.

## Scripts

| Command                                  | What it does                                                |
| ---------------------------------------- | ----------------------------------------------------------- |
| `bun run drizzle:generate --name=<what>` | Writes a migration from schema changes. No DB connection    |
| `bun run drizzle:migrate`                | Applies migrations                                          |
| `bun run drizzle:push`                   | Syncs the schema directly. `--explain` only prints the plan |
| `bun run drizzle:studio`                 | Database browser on port 8337                               |

**Never run `migrate` or `push` against the real database yourself.** It holds the
encrypted seeds. Generate the migration, read the SQL, and tell the owner what to run. A
column dropped by accident can be the only copy of a seed.

`push` only looks at `public` because of `schemaFilter` in `drizzle.config.ts`: v1 manages
every schema by default, and offers to drop the ones it doesn't know. Inside `public`, it
still plans a `DROP TABLE` for any table the code doesn't have, so read `--explain` first.

Prefer a schema that doesn't need a migration when one is enough. Any `select *` on a
table fails as soon as the code knows a column the database doesn't have, so a change must
ship together with its migration.

## Re-creating the database

`20261101004910_init` is the baseline for v1. It replaces `0000_redundant_whiplash`, and
its schema is stricter. The owner re-created the real database from it on 2026-11-01,
brought the data back from a backup, and checked that it's complete.

A database older than the baseline can't take `migrate`. With the old migration table it
refuses (`do not match any local migration`). Without one it fails on `CREATE TABLE`, and
leaves only an empty `drizzle.__drizzle_migrations`. Neither touches the data.

To do it again, the owner runs these steps, never an agent:

1. Restore the backup into a temporary database, and compare its row counts with what you
   expect. Each of these must return nothing, or the new schema will refuse those rows:

   ```sql
   select wallet_id, purpose, index from accounts group by 1, 2, 3 having count(*) > 1;
   select account_id, type, index from addresses group by 1, 2, 3 having count(*) > 1;
   select id from accounts where purpose not in (84, 86) or index < 0;
   select id from addresses where type not in ('receive', 'change') or index < 0;
   ```

2. On an empty database, run `bun run drizzle:migrate` as the role the app connects with,
   so that it owns the tables.
3. Copy only the rows, never a whole dump, which would bring back the old schema:

   ```sh
   pg_dump --data-only --table=wallets --table=accounts --table=addresses <temporary> | psql <new>
   ```

4. Keep `CIPHER_*` as they are, or `bio` can't be decrypted. Don't use
   `bun tests/wallet.spec.ts recover` to bring a wallet back: it makes new account IDs,
   and an account's ID is the name of its Bitcoin Core wallet, so it means new wallets on
   the node and another rescan.
5. Check with `bun tests/wallet.spec.ts list` and by opening the app, before removing the
   old database.

On PGlite with `--inserts`, old rows moved into this baseline this way came through
identical, including account IDs and `started_at`.
