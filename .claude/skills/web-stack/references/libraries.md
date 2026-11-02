# Libraries

Version-specific usage for everything except Next.js ([nextjs.md](nextjs.md)), Drizzle
([database.md](database.md)), and UI components ([ui-components.md](ui-components.md)).

Install with `bun add <pkg>`. Ask before adding a dependency: in a wallet, every package
is code that runs next to the seed. `bun audit` must stay at zero after a change. Drizzle,
crypto packages and Next.js are pinned to exact versions on purpose: upgrade them
deliberately, one at a time.

## Bun

- `bun --bun` in the `package.json` scripts makes Next.js and drizzle-kit run on Bun.
  Without it they run on Node.js, because their executables start with a Node.js shebang.
- Bun loads `.env` for you, and values already in the environment win over the file. No
  `dotenv`.
- `Bun.password` hashes the passkey, so there's no native `argon2` package. Its hashes are
  compatible with the ones that package wrote.
- `bunfig.toml` refuses packages published in the last 3 days (`minimumReleaseAge`): most
  supply-chain attacks on npm are caught within that time. Bun also doesn't run the
  install scripts of a dependency unless it's on Bun's short default list or in
  `trustedDependencies`. Don't add to that without asking.

## Zod v4

```ts
import { z } from "zod"

export const queryValidator = query.omit({ status: true, search: true }).extend({
  status: z.enum(["all", "used", "unused"]).optional(),
  type: z.enum(["all", "change", "receive"]).optional()
})

export type QueryValidator = z.infer<typeof queryValidator>
```

v4 differences from v3 (don't use the v3 forms):

| v3                               | v4                                                 |
| -------------------------------- | -------------------------------------------------- |
| `z.string().email()` / `.uuid()` | `z.email()`, `z.uuid()`, `z.url()` (top-level)     |
| `error.flatten()` / `.format()`  | `z.flattenError(error)`, `z.treeifyError(error)`   |
| `{ message: "…" }`               | `{ error: "…" }` (message still works, deprecated) |
| `z.nativeEnum(Enum)`             | `z.enum(Enum)`                                     |

- `safeParse` in Server Actions (return the failure); `parse` for env and trusted internal
  data.
- **Import shared schemas from `@/libs/validator.zod`**, which runs
  `z.config({ jitless: true })`. Without it, Zod tries `new Function` in the browser, and
  the CSP reports a violation.
- `passphraseInputValidator` is for unlocking an existing wallet: it only bounds the
  length. `passphraseValidator` holds the strength rules, for a new passphrase only. Old
  wallets may not meet today's rules, and the real check is the hash.

## zustand v5 — client state

Store-per-request through context, never a module-level global store, which would leak
between requests on the server. Follow `src/stores/main/`:

- `state.ts`: `State` and `Actions` types, `createXStore(initialState)` with
  `createStore<XState>()(…)`.
- `index.tsx`: `"use client"`, context, `XStoreProvider` holding the store in `useRef`,
  `useXStore(selector)`. Providers are mounted in `components/providers.tsx`.
- `stores/main/` has the theme, the language, and the loader, which nothing reads yet, and
  `node`, what the navbar shows. That's the one piece of server data here, by the owner's
  choice ([how it stays fresh](nextjs.md#keeping-a-page-up-to-date)). Other server data
  doesn't belong here: it arrives as props, and the sync keeps it fresh.
- Always select the smallest slice: `useMainStore((state) => state.theme)`.
- **Display data only.** Never put a seed or a passphrase in a store.

## Tailwind CSS v4

- CSS-first config: there is no `tailwind.config.js`. Tokens live in
  `src/styles/theme.css` `@theme`.
- v4 syntax: `bg-(--my-var)`, `max-sm:`, `inset-shadow-*`. Opacity via slash:
  `bg-white/20`.
- Keep classes as static strings, not `` `bg-${color}` ``: Tailwind only generates what it
  finds.

## es-toolkit

Arguments go object first, then the keys:

```ts
import { omit, pick } from "es-toolkit"

db.select(omit(walletColumns, ["bio", "passkey"]))
```

## Crypto libraries

- `@noble/*` and `@scure/*` import with `.js` subpaths: `@noble/hashes/sha2.js`,
  `@noble/ciphers/chacha.js`, `@noble/hashes/utils.js`. `@scure/btc-signer`,
  `@scure/bip32`, and `@scure/bip39` import from the package root.
- Never hand-roll crypto, and never use `Math.random` for anything that matters. Use
  `crypto.randomInt`, `crypto.randomUUID`, or `randomBytes`.
- Keep these out of client bundles. Client code that needs units imports
  `@/libs/bitcoin/unit`, which only depends on `@/libs/bitcoin/constants`. Never import
  `scure.ts`, `transaction.ts`, `cipher.ts`, or the wordlist from a client component.

## date-fns v4

Format durations and dates with date-fns, not hand-rolled math: `format(date, "PPpp")`,
`addHours`, `isAfter`, `secondsToMilliseconds`.

## uuid

Primary keys come from Postgres or `crypto.randomUUID()`. `uuid` is for `v5` request IDs
in the RPC client.

## nuqs

`src/libs/validator.nuqs.ts` parses search params on the server. `NuqsAdapter` isn't
mounted, so mount it in `layout/provider.tsx` before using `useQueryState`.
