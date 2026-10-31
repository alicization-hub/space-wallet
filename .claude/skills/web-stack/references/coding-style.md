# Coding Style

## Formatting (Prettier does it — don't fight it)

`prettier.config.mjs` is the source of truth. Run `bunx prettier --write <files>` after
editing. Key results:

- No semicolons. Double quotes in TS (`"use server"`), **single quotes in JSX attributes**
  (`className='flex gap-4'`).
- `printWidth: 90`, `trailingComma: "none"`, `bracketSameLine: true`, LF line endings.
- Tailwind classes are auto-sorted, including inside `cls(...)` and `clsx(...)`.
- Imports are auto-grouped, separated by a blank line, in this order:

1. Node built-ins (`crypto`, `fs`)
2. Third-party packages (`next/headers`, `zod`)
3. `@/` aliases
4. Relative (`../token`, `./validator.zod`)
5. CSS (side-effect imports)

Older files still have single quotes because they haven't been touched since the config
changed. They convert when you format them. Don't reformat files you aren't otherwise
changing: it buries the real diff.

## TypeScript

- `strict` is on. Prefer `import type { X }` for types, and always use it when importing a
  type from a `server-only` module into a client component.
- Avoid `any` in new code. Use `unknown` and narrow, or infer from the source of truth:
  `z.infer<typeof schema>`, `InferSelectModel<typeof table>`.
- Types live next to what produces them: Zod types in the validator, DB types in
  `drizzle/types.ts`, app-wide ambient types in `src/types/*.d.ts` (`declare type`).
- Props are typed inline and wrapped in `Readonly<{ … }>`:

```tsx
export function InputLabel({
  title,
  isRequired
}: Readonly<{
  title: string
  isRequired?: boolean
}>) {
```

- `type` over `interface`. Numeric separators for readability: `5_000`, `1_000_000`.

## Naming

| Thing                     | Convention                          | Example                                         |
| ------------------------- | ----------------------------------- | ----------------------------------------------- |
| Components                | PascalCase function                 | `Button`, `Snippet`, `AccountSync`              |
| Page / layout components  | PascalCase, named after the route   | `Index`, `Account`, `WalletLayout`              |
| Hooks                     | `useX`                              | `useOverlayState`, `useCountdownTimer`          |
| Server Actions            | verb + noun, camelCase              | `syncAccount`, `readUTXOs`, `createTransaction` |
| Zod schemas / their types | `xValidator` / `XValidator`         | `createValidator` / `CreateValidator`           |
| nuqs caches / their types | `queryValidator` / `QueryValidator` | `searchValidator` / `SearchValidator`           |
| Constants                 | SCREAMING_SNAKE_CASE                | `APP_TOKEN`, `GAP_LIMIT`                        |
| Booleans                  | `is` / `has` / `should` prefix      | `isSynced`, `hasCloseButton`                    |
| Event handlers            | `handleX`                           | `handleCopy`, `handleClick`                     |
| Cache tags                | `<entity>/<id>`, kebab-case entity  | `utxos/${accountId}`, `fees/recommended`        |
| DB columns                | camelCase in TS, snake_case in SQL  | `isActive: boolean("is_active")`                |

The same conventions as luminous. What that leaves to decide here:

- `ModalComponent` and `DrawerComponent` are the only components with the suffix.
- A component in a feature folder takes the feature's name where the bare word would be
  vague or clash: `SendForm` and `ReceiveForm`, `AddressItem` and `UtxoItem`.
- Reading is always `readX`. A `"use cache"` helper says so (`readCachedUTXOs`), and is
  never exported.
- No `I` prefix on types. The env validators keep `envSchema`, `dbSchema`, `rpcSchema` and
  `cipherSchema`, as in luminous.
- Names from outside keep their spelling, whatever the table says: the node's JSON
  (`ismine`, `allowed`, `next_index`), its RPC methods on `RPCClient` (`getWallet`), and
  native attributes (`disabled`). Renaming `allowed` on `testmempoolaccept`'s answer would
  stop every send.

## Exports

- Named exports for everything shared (`export function Button`).
- `export default` only where Next.js requires it (`page`, `layout`, `error`, `not-found`,
  route config) and for modules loaded with `next/dynamic` (`components/space/stars.tsx`).

## Component and hook body order

Keep this order in every component and hook: state, then functions, then effects, then
what it renders or returns. Don't mark the parts with comments.

```tsx
export function Snippet({ codeString }: Readonly<{ codeString: string }>) {
  const [isCopied, setIsCopied] = useState<boolean>(false)

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(codeString)
    setIsCopied(true)
  }, [codeString])

  useEffect(() => {
    …
  }, [])

  return <button onClick={handleCopy}>…</button>
}
```

## Comments

Multi-line block form for anything that explains code, even a single sentence:

```ts
/**
 * Reads an account only if it can be used.
 */
```

Not `/** Reads an account. */` on one line. A short `//` inside a function body is fine
for a step in a sequence, as `createTransaction` does.

- Comment the **why** (constraints, trade-offs, non-obvious behaviour), not the what. In a
  wallet, the reason a check exists is what stops the next person from removing it.
- Public helpers in `libs/` and `actions/` get JSDoc with `@param`, `@returns`, and an
  `@example` when usage isn't obvious.
- No commented-out code and no `TODO` in finished work.

## React rules

- Server Components by default. Add `"use client"` only to the leaf that needs state,
  effects, or browser APIs.
- **No React Compiler.** Memoize manually: `useCallback` for handlers passed to children
  or used in effects, `useMemo` for derived objects/arrays and for objects returned from
  hooks.
- Dependency arrays must be complete. A missing dependency is a stale-closure bug.
- Clean up every effect: listeners, intervals, timeouts.
- Don't use `useEffect` to derive state from props: compute it during render or with
  `useMemo`.
- Keys are stable IDs. A UTXO's key is `` `${txid}:${vout}` ``, because one transaction
  can pay the wallet more than once.

## Styling

- Tailwind utilities in JSX; merge conditional classes with `cls()` from `@/libs/utils`
  (clsx + tailwind-merge).
- Design tokens go in `src/styles/theme.css` under `@theme`. Reusable multi-utility
  patterns go in `src/styles/globals.css` under `@layer components` (`.mirror`,
  `.form-input`).
- The app is dark-only. Use `bg-background` / `text-foreground`, the `space-*` greys, and
  the inverted `foreground-*` scale (see [ui-components.md](ui-components.md#theme)).
- Use `svh`/`dvh` units for full-height layouts.

## Errors

- Expected failures in Server Actions are **returned**, not thrown:
  `return { success: false, message }`. Next.js replaces thrown messages with a generic
  one in production, so a thrown "Invalid passphrase" never reaches the user. A node that
  doesn't answer is an expected failure, so `try`/`catch` belongs on the server side.
- **No `try`/`catch` around a Server Action in a Client Component.** Call it inside
  `startTransition` from `useTransition` and read `isPending` for the spinner (see
  [nextjs.md](nextjs.md#server-actions)). What can still throw is unexpected, and goes to
  `app/error.tsx` by itself.
- `app/error.tsx` can appear in the middle of a send, so it must keep saying the money may
  have gone out.
- Logging on the server uses `logger()` from `@/libs/logger`. Never log a passphrase, a
  seed, `bio`, or `passkey`.

## Environment variables

Read env only through `@/constants/env` (`ENV`, `DB`, `DATABASE_URL`, `RPC`, `CIPHER`),
which are parsed by Zod in `constants/env/validator.zod.ts`. When adding a variable: add
it to `.env.example`, add it to the Zod schema, export it from `constants/env/index.ts`. A
credential gets no default: a missing value must stop the app. Never import
`@/constants/env` or `@/constants` from a Client Component. Only `NEXT_PUBLIC_*` values
reach the client.
