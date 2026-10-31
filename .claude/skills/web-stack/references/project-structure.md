# Project Structure

Path alias: `@/*` → `./src/*`. Always import across folders with `@/`; use relative
imports only inside the same feature folder.

## Repo root

| Path           | Purpose                                                                            |
| -------------- | ---------------------------------------------------------------------------------- |
| `src/`         | The app (below)                                                                    |
| `tests/`       | **Scripts**, not tests. The project has no automated tests (keep the name `tests`) |
| `docs/`        | The owner's setup guide: WSL, Docker, Tor, Bitcoin node                            |
| `public/`      | Static files only                                                                  |
| `next-prod.ts` | The production HTTPS server                                                        |
| `backup.sh`    | Postgres backup through Docker Compose                                             |

`tests/` holds one-off and maintenance scripts run with bun from the repo root. Name them
`<topic>.spec.ts`. A script too big for one file keeps its entry there and its parts in
`tests/<topic>s/` (`tests/wallet.spec.ts` + `tests/wallets/*.ts`). They may import from
`@/…`, and must end the DB connection (`db.$client.end()`) so the process exits.

Scripts can't import anything with `import "server-only"`, because that package throws
outside Next.js. That rules out `@/actions/*`. Shared logic for scripts goes in
`@/libs/bitcoin`, `@/libs/cipher`, `@/libs/password`, `@/drizzle`.

## Top level of `src/`

```
src/
├── actions/              Shared Server Actions and readers, by domain (see below)
├── app/
│   ├── (dashboard)/      `/`: the node dashboard. It must render while the node syncs
│   ├── (wallet)/         The wallet ([uuid]/) and index/, which opens the oldest wallet or says there is none, behind the node warning
│   └── layout.tsx, error.tsx, not-found.tsx    The root layout holds the navbar and the page column
├── components/           Shared UI, one folder per feature (send/, receive/, transaction/, wallet/, navbar/)
│   └── ui/               The framer-motion kit (ui-components.md)
├── constants/            Enums, metadata, fonts, wordlists; env/
├── drizzle/              db client, schema/*.schema.ts, migrations, types
├── hooks/                Shared client hooks, re-exported from hooks/index.ts
├── libs/
│   ├── bitcoin/          Pure Bitcoin code: keys, addresses, descriptors, signing, RPC client, units, telemetry
│   └── cipher.ts, password.ts, rate-limit.ts, logger.ts, utils.ts, validator.zod.ts
├── proxy.ts              Refuses other host names and sets the Content-Security-Policy, nothing else
├── stores/<name>/        zustand store: state.ts (createXStore) + index.tsx (Provider + hook)
├── styles/               globals.css, theme.css (@theme tokens)
└── types/                Global ambient types (declare type …), rpc/ for Bitcoin Core responses
```

## `actions/`

Shared code, one folder per domain. What decides the file is who may call the code:

| File                        | Directive      | What it is                                                   |
| --------------------------- | -------------- | ------------------------------------------------------------ |
| `account/index.ts`          | `server-only`  | `withAccount`, `readActiveAccount`                           |
| `passphrase.ts`             | `server-only`  | `checkSend`: the rate-limited passphrase check               |
| `rpc.ts`                    | `server-only`  | `readNodeStatus`, `readNodeInfo`                             |
| `fee.ts`                    | `"use server"` | `readFees`                                                   |
| `address/read.ts`           | `"use server"` | `readAddress`, `readAddresses`                               |
| `utxo/read.ts`              | `"use server"` | `readUTXOs`                                                  |
| `transaction/read.ts`       | `server-only`  | `readTransactions`, guarded, for the page and the sync       |
| `transaction/create.ts`     | `"use server"` | `createTransaction`                                          |
| `transaction/format.ts`     | `server-only`  | `formatTransaction`                                          |
| `account/read.ts`           | `server-only`  | `readAccount`, `readAccounts`, `readFirstAccount`, for pages |
| `account/update.ts`         | `"use server"` | `syncAccount`: keeps an open page up to date                 |
| `address/update.ts`         | `server-only`  | `markAddressesUsed`: unguarded, callers check first          |
| `<domain>/validator.zod.ts` | none           | Zod schemas, safe to import from client forms                |

**A `"use server"` file makes every export a public URL.** If only server code calls a
function, the file gets `import "server-only"` instead. Never add `"use server"` to a
helper "because it runs on the server": that's how `findWallet` once returned the
encrypted seed to anyone who asked. **A `"use cache"` function in a file a Server
Component imports is a public URL too**, exported or not (see
[nextjs.md](nextjs.md#caching)).

## Route folder layout

Every page folder follows the same shape. Create only the files you need, but use these
names:

```
app/(wallet)/<route>/
├── page.tsx              Server Component (plain SSR). Parses params, loads data with Promise.all, composes
├── layout.tsx            (optional) shared chrome for nested segments
├── actions/              Route-local Server Actions and cached readers
│   ├── read.ts           "use server" or cached query functions for this page
│   ├── create.ts         (when the page mutates)
│   ├── update.ts
│   └── delete.ts
├── components/           Route-local components (kebab-case files, named exports)
├── utils.ts              Route-local pure helpers (formatting, mapping DB rows → view models)
├── validator.nuqs.ts     Search params schema: createSearchParamsCache → queryValidator / QueryValidator
└── validator.zod.ts      Form / action input schema: formValidator / FormValidator
```

Dynamic segments nest the same structure: `app/(wallet)/[uuid]/page.tsx`. Scaffold with
`bun .claude/skills/web-stack/scripts/new-route.ts <segment>`, which makes these under
`(wallet)`, then delete what the route doesn't need. `(dashboard)` is a route in this
shape.

A route's `actions/` is as public as `@/actions/`, so the rules above still apply:

- A `"use server"` export is a public URL, and one that takes an account is wrapped in
  `withAccount`.
- A reader only the page calls gets `import "server-only"` instead of `"use server"`
  (`(dashboard)/actions/read.ts`).
- `"use cache"` only goes in a file no Server Component imports
  ([nextjs.md](nextjs.md#caching)).

The root layout gives every page the navbar and the `max-w-space` column, which it hides
below 1024px ([why](ui-components.md#screen-width)). The route group decides what else
surrounds the page: `(wallet)` hides the page behind a warning until the node has synced,
so a page that has to work during a sync goes outside it, as `(dashboard)` does.

## Local vs shared — where does it go?

| Used by…                        | Action / reader                   | Component                   | Hook / util              |
| ------------------------------- | --------------------------------- | --------------------------- | ------------------------ |
| One route                       | `app/…/<route>/actions/<crud>.ts` | `app/…/<route>/components/` | `app/…/<route>/utils.ts` |
| Two or more routes              | `@/actions/<domain>/<crud>.ts`    | `@/components/<feature>/`   | `@/hooks/` or `@/libs/`  |
| Not tied to React / Next at all | —                                 | —                           | `@/libs/`                |

Start local. Promote to the shared folder when a second route needs it: move it, don't
copy it.

**Exception: the account page's code.** `@/components/send/`, `receive/`, `transaction/`,
and `wallet/`, and `@/actions/transaction/`, `utxo/`, `address/`, and `fee.ts`, stay
shared, though only `[uuid]` uses them. Don't merge them into one route `read.ts`:
`transaction/read.ts` is `server-only` while `utxo/read.ts` is `"use server"` with
`"use cache"`, so a single file would make the first public and expose the second. A new
route follows the layout above.

A constant one file uses stays at the top of that file (`PURPOSE_LABELS`, a component's
`SIZES`). When a second file needs it, it moves to `@/constants`, or to the validator that
owns it (`LATEST_TRANSACTIONS`).

Shared actions are grouped by domain and split into CRUD files, each only when the domain
needs it: `read.ts`, `create.ts`, `update.ts`, `delete.ts`. A domain with one job is one
file named for it (`fee.ts`, `passphrase.ts`, `rpc.ts`), and what doesn't fit CRUD gets
its own kebab-case file in the domain folder (`transaction/format.ts`).

## File naming

| Kind              | Convention                         | Example                                    |
| ----------------- | ---------------------------------- | ------------------------------------------ |
| Files and folders | kebab-case                         | `number-input.tsx`, `address-selection/`   |
| Hook files        | kebab-case with `use-` prefix      | `use-countdown.ts`, `use-overlay-state.ts` |
| Validators        | `validator.<lib>.ts`               | `validator.zod.ts`, `validator.nuqs.ts`    |
| Drizzle schema    | `<domain>.schema.ts`               | `wallets.schema.ts`                        |
| Scripts           | `<topic>.spec.ts`                  | `wallet.spec.ts`                           |
| Route groups      | `(wallet)`                         |                                            |
| Global types      | `src/types/*.d.ts`, `declare type` | `AuthToken`, `NextParams`                  |

**Every file and folder name is kebab-case**: components, hooks, stores, utils, and
scripts alike (`number-input.tsx`, `use-effect-sync.ts`, `wallet.spec.ts`). The only
exceptions are names the framework fixes (`page.tsx`, `layout.tsx`, `route.ts`,
`next.config.ts`, …) and the dotted suffixes in the table above (`.zod`, `.nuqs`,
`.schema`, `.spec`). This is about file names only: exported identifiers stay camelCase /
PascalCase (`useEffectSync`, `NumberInput`).

A folder's main component is `index.tsx` (`components/send/index.tsx`,
`components/ui/modal/index.tsx`).

## Barrels

Only `hooks/index.ts` is a barrel. Don't add other `index.ts` re-exports: they blur the
server/client boundary and hurt tree-shaking.
