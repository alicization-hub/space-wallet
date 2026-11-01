---
name: web-stack
description:
  Project rules for Space, a private self-hosted Bitcoin wallet on the owner's own Bitcoin
  Core node. Load before writing, editing, reviewing, or formatting any .ts/.tsx/.css
  file, before running install, database, or wallet commands, and before designing a
  feature, even when the request names no library (e.g. "add a fee option", "show address
  labels", "fix the send form", "add a modal", "recover my wallet"). Covers the stack
  (Bun, Next.js 16 with Cache Components, React 19, a framer-motion UI kit instead of
  HeroUI, Tailwind v4, Drizzle ORM + Postgres, Zod v4, zustand), folder layout, coding
  style, security rules, Bitcoin signing and descriptors, and the wallet scripts.
---

# Web Stack — Project Space

Space is a private web wallet for one owner: Next.js in front, a Bitcoin Core full node
behind it, Postgres for the encrypted seed and address book. **It holds real money, and
Bitcoin transactions can't be undone.** Build it as if a bug costs funds, because it can.

Don't fall back on generic or older-version knowledge (Next.js 13–15 patterns,
`middleware.ts`, Zod v3, Drizzle 0.x, lodash, JWT libraries, HeroUI / NextUI, Node.js-only
scripts). Every library here has breaking changes from what most training data shows. When
unsure about a Next.js API, read `node_modules/next/dist/docs/01-app/` first. If a general
skill says HeroUI, Hugeicons, or es-toolkit, this file wins: the project uses none of
them.

## Mindset: Software Engineer, not Vibe Coder

"Looks good. It works. Ship it!" is not good enough here. Work to "Plan. Design.
Structure. Scale."

- **Plan before typing.** Read the surrounding code and find the existing helper, hook,
  component, or validator before creating a new one. Reuse > duplicate.
- **Put code where it belongs.** Follow
  [project structure](references/project-structure.md). No logic dumped into a page
  because it was convenient.
- **No placeholder hacks.** No `// TODO`, `// TEMP`, commented-out code, or `console.log`
  left behind unless the owner asked for a stub. If something is unfinished, say so in
  your reply.
- **Understand every fix.** If you can't explain why a change works, it isn't done.
- **Assume the attacker.** Every Server Action and Route Handler is a public URL. Read
  [security](references/security.md) before touching one.
- **Verify.** Run Prettier on what you touched and, for non-trivial changes,
  `bun run build`. For anything that moves money or keys, test it end to end against
  throwaway services ([how](references/bitcoin-wallet.md#testing-without-real-funds)).

## Stack

| Layer        | Tool                                                                   | Notes                                                                      |
| ------------ | ---------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Runtime / PM | Bun 1.4                                                                | `bun add`, `bun run`, `bunx`, never npm/yarn/pnpm or Node.js               |
| Framework    | Next.js 16.4                                                           | App Router, `cacheComponents`, `proxy.ts`, every page rendered per request |
| UI runtime   | React 19.3                                                             | **No React Compiler**: memoize manually                                    |
| Styling      | Tailwind CSS v4                                                        | CSS-first `@theme` in `src/styles/theme.css`, `cls()` merge                |
| UI library   | Own kit on framer-motion 14 (`components/ui/`)                         | `m.*` under `LazyMotion strict`. See [ui](references/ui-components.md)     |
| Icons        | `@keyline-icons/react`                                                 | Named `XIcon` imports, colour from `text-*`                                |
| Database     | Drizzle ORM v1 RC (`1.0.0-rc.5`, pinned) + `postgres`                  | `defineRelations`, `drizzle-kit`. See [database](references/database.md)   |
| Bitcoin      | `@scure/*`, `@noble/*`, Bitcoin Core JSON-RPC                          | The node watches through xpubs and never holds a key                       |
| Auth         | No sign-in. A send needs the wallet's passphrase (argon2)              | See [security](references/security.md)                                     |
| Validation   | Zod v4                                                                 | env, Server Action input, forms                                            |
| Forms        | react-hook-form v7 + `@hookform/resolvers`                             | Zod resolver, shares the action's validator                                |
| Client state | zustand v5                                                             | `src/stores/<name>/`, display data only                                    |
| Utilities    | ramda, date-fns v4, uuid, clsx, tailwind-merge                         | `omit(keys, object)`: ramda takes the keys first                           |
| Formatting   | Prettier 3.9 + `@ianvs/prettier-plugin-sort-imports` + tailwind plugin | `prettier.config.mjs` is the source of truth                               |

## Reference files — read the one that matches the task

| Task                                                                     | Read                                                    |
| ------------------------------------------------------------------------ | ------------------------------------------------------- |
| Creating a route, action, component, hook, or any new file               | [project-structure.md](references/project-structure.md) |
| Writing or reviewing any code (naming, comments, ordering, types)        | [coding-style.md](references/coding-style.md)           |
| Pages, layouts, caching, Server Actions, Route Handlers, `proxy`         | [nextjs.md](references/nextjs.md)                       |
| Buttons, modals, drawers, toasts, any UI component, theme tokens, motion | [ui-components.md](references/ui-components.md)         |
| Zod, react-hook-form, zustand, Tailwind, ramda, crypto library imports   | [libraries.md](references/libraries.md)                 |
| Tables, queries, migrations                                              | [database.md](references/database.md)                   |
| Guards, rate limits, CSP, other sites, env, anything security-related    | [security.md](references/security.md)                   |
| Keys, addresses, descriptors, sending, RPC, the wallet scripts, testing  | [bitcoin-wallet.md](references/bitcoin-wallet.md)       |
| Running prod, localhost only, HTTPS, certificates, backups               | [deployment.md](references/deployment.md)               |
| Anything user-facing, or the sync that keeps a page fresh                | [performance.md](references/performance.md)             |

## Tools

- `bun .claude/skills/web-stack/scripts/new-route.ts <segment>` — scaffolds a route folder
  under `(wallet)`. Example: `bun .claude/skills/web-stack/scripts/new-route.ts settings`.
- `bunx prettier --write <files>` — format what you touched.
- `bunx next typegen && bunx tsc --noEmit -p .` — quick type-check.
- `bun run build` — full type-check and Cache Components validation. It needs a valid
  `.env`, because the env schema runs at build time. It reaches neither the node nor the
  database.
- `bun audit` — known vulnerabilities in dependencies. Keep it at zero.
- `bun run start:dev` — dev server on `https://localhost:8338`.
- `bun run build && bun run start:prod` — HTTPS server. See
  [deployment.md](references/deployment.md).
- `bun run drizzle:generate` / `bun run drizzle:push` / `bun run drizzle:studio` — see
  [database.md](references/database.md).
- `bun tests/wallet.spec.ts <create|recover|addresses|list>` — manage wallets. See
  [bitcoin-wallet.md](references/bitcoin-wallet.md#wallet-scripts).
- `bun tests/app.spec.ts` — check the connection to Bitcoin Core.
- `bun tests/balance.spec.ts` — copy every account's balance from the node to the DB.

## Project notes

- **Wallets are managed from the terminal only.** Create and recover live in
  `tests/wallet.spec.ts`. Don't add a UI or a Server Action for them: a seed must never
  pass through a browser, an extension, or a network request.
- **The app only opens on `localhost` and `127.0.0.1`,** in dev and prod. Don't add a way
  to open it to a network. See [deployment.md](references/deployment.md).
- **There is no sign-in.** One person uses this app. `/` is the node dashboard, and its
  link goes to `/index`, which opens the oldest wallet or says how to create one when
  there are none. Switching wallets is opening another account's URL; the UI for it is
  still to come. Don't add a session back without asking.
- **No automated tests.** Don't write unit/integration tests or add a test runner. The
  `tests/` folder is the **scripts** folder (it keeps that name). To check a change end to
  end, use throwaway services outside the repo
  ([how](references/bitcoin-wallet.md#testing-without-real-funds)).
- **No shared test credentials.** Never read `.env`, never use the owner's wallet or node
  to try something.

## Definition of done

1. Code lives in the right folder with the right file name.
2. Inputs are validated with Zod on the server. Env is read only through
   `@/constants/env`.
3. No `"use cache"` function is exported, and every `"use server"` export is wrapped in
   `withAccount` if it takes an account, and it returns only what the UI needs.
4. `bio` and `passkey` never reach a response, a log, or a cache key.
5. Anything secret typed by the owner goes through `commandInput`, never an argument.
6. Comments follow the block style, no leftovers.
7. Prettier run; `bun run build` passes for non-trivial changes; `bun audit` is clean
   after a dependency change. If you could not run one of these, say so.
