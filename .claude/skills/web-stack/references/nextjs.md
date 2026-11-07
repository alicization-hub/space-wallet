# Next.js 16 in this project

This is Next.js **16.4** with **Cache Components** on, running on **Bun**. It behaves
differently from Next.js 13–15. Before using an API you're unsure about, read its page
under `node_modules/next/dist/docs/01-app/`:

| Topic                      | Doc                                                 |
| -------------------------- | --------------------------------------------------- |
| Caching model              | `01-getting-started/08-caching.md`                  |
| `use cache`                | `03-api-reference/01-directives/use-cache*.md`      |
| Auth + Cache Components    | `02-guides/authentication-with-cache-components.md` |
| Data security, auditing    | `02-guides/data-security.md`                        |
| CSP and nonces             | `02-guides/content-security-policy.md`              |
| Status codes and streaming | `02-guides/streaming.md`                            |
| Route Handlers             | `03-api-reference/03-file-conventions/route.md`     |
| Proxy (was middleware)     | `01-getting-started/16-proxy.md`                    |

## Things that changed and trip people up

- **`middleware.ts` is now `proxy.ts`** (in `src/`, exporting `proxy`). Here it refuses
  other host names and sets the CSP. Don't add auth to it: pages, actions, and handlers
  check for themselves, and a proxy can be bypassed.
- **`params` and `searchParams` are Promises.** Always `await` them. Use the project's
  `NextParams<{ … }>` / `NextSearchParams` types.
- **`cookies()`, `headers()`, `draftMode()` are async.**
- **`"use cache"` replaces `unstable_cache`, `fetch` cache options, and
  `export const revalidate`.**
- `next/image`: `priority` is replaced by `preload`. The optimizer is off
  (`images.unoptimized`), because its endpoint has had remote code execution advisories
  and the app has only a few small images.

## Rendering: every page per request

The Content-Security-Policy uses a nonce per request, and a prerendered script has no
nonce, so the browser would block it. So nothing is prerendered:

- `app/layout.tsx` awaits `connection()` and sets `export const instant = false`.
- **A page that reads the database starts with `await connection()`, and has its own
  `export const instant = false`** (see `(wallet)/index/page.tsx`). Without the first, the
  build would connect to the real database: `postgres` isn't held back the way `fetch` is.
  Without the second, `next dev` reports "encountered runtime data during prerendering".

- `partialPrefetching: false` in `next.config.ts`: a prerendered App Shell has no nonce
  either.

Don't remove any of these to speed something up. The page would still load, with its
scripts blocked and nothing interactive.

**Status codes.** Once a response has started streaming, its status stays 200. A
`notFound()` in a page then renders the not-found UI with `noindex`, and a `redirect()`
becomes a client-side redirect. No data is sent either way. That's documented Next.js
behaviour, so judge these by content, not by status. Where the status matters, use a Route
Handler.

## Caching

`"use cache"` is for data that's expensive and not secret. Rules:

- **Cache keys are stored in plain text.** A cached function's arguments go in the key, so
  never pass a token, a passphrase, or a seed. Passing an account ID is fine.

- **`"use cache"` only in a `"use server"` file that no Server Component imports, and
  never exported.** Otherwise Next.js registers the function as a server reference, and
  anyone holding its ID can call it, past every guard. An unexported function, a plain
  wrapper, or `server-only` doesn't change that. This was measured on the build, not read
  in the docs, so after adding one, check the build (see
  [security.md](security.md#guarding-code)). That's why `actions/rpc.ts`,
  `transaction/read.ts`, and `(dashboard)/actions/read.ts`, which pages read, aren't
  cached: their calls are small, and the node is local.
- **The guarded export checks the account, then calls the unexported cached reader**, so
  nothing can reach the cached data without the check:

```ts
"use server"

async function readCachedX(accountId: string) {
  "use cache"
  cacheTag(`x/${accountId}`)
  cacheLife("seconds")
  …
}

export const readX = withAccount(async (account) => readCachedX(account.id))
```

Nothing in the app is cached this way today.

- Cached functions are deterministic given their arguments. No `new Date()` comparisons,
  no `cookies()`, no writes. Read runtime values outside and pass them in.
- Built-in `cacheLife` profiles: `"seconds"`, `"minutes"`, `"hours"`, `"days"`, `"weeks"`,
  `"max"`. Keep balances and UTXOs on `"seconds"`.

## Page pattern

A page is a thin async Server Component. It takes its inputs, loads what it needs in
parallel, and passes plain data to components as props. It doesn't use `<Suspense>`: every
page renders per request, and the server waits for all of it.

```tsx
export const instant = false

export default async function Account({ searchParams }: NextSearchParams) {
  await connection()

  const { vid } = await queryValidator.parse(searchParams)
  const result = await readAccount(vid)
  if (!result) notFound()

  const account = omit(result, ["wallet"])
  const transactions = await readTransactions(account.id, LATEST_TRANSACTIONS)

  return …
}
```

`readAccount` checks the ID from the URL, and gives nothing for one it can't open.

## Server Actions

```ts
"use server"

export const readAddresses = withAccount(async (wallet, account, input: QueryValidator) => {
  const query = queryValidator.parse(input)
  …
  return toPagination(results, total, query.page, query.take)
})
```

- `"use server"` at the top of the file; **every export is a public endpoint**. Treat it
  like an API route. Unused exports get removed at build, but don't rely on it.
- **Validate every input with Zod on the server**, even if the form already validated it.
- **Check the account inside the action** with `withAccount`, before anything reaches the
  node. Other sites are kept out by `src/proxy.ts` (see
  [security.md](security.md#what-keeps-other-sites-out)).

- Return only what the UI needs, never a raw row with secrets, never an `Error` object.
- Return `{ success, message }` for expected failures: thrown messages are hidden in
  production.
- Server Actions run one at a time per client, so a slow one holds up whatever comes after
  it. Keep `syncAccount` small.

A Client Component calls one inside a transition, with no `try`/`catch`:

```tsx
const [isPending, startTransition] = useTransition()

const handleClick = useCallback(() => {
  startTransition(async () => {
    const result = await readAddress(accountId)
    if (!result.success)
      toast({ title: "🚫 An error occurred", description: result.message })
  })
}, [accountId])
```

- `isPending` is the spinner, and it clears by itself.
- A thrown error reaches `app/error.tsx`. Without the transition, a rejection would only
  reach the console.

## Keeping a page up to date

`useSyncInterval` (`@/hooks`) calls a Server Action every 15 s and when the tab comes
back, but never while it's hidden. The action calls `refresh()`, so the answer carries the
page rendered fresh.

- `AccountSync` (`components/wallet/sync.tsx`) calls `syncAccount`, as the page opens too.
  That action also copies the balance to the DB and marks used addresses.
- `NodeSync` (`app/(dashboard)/components/sync.tsx`) calls `syncNode`
  (`app/(dashboard)/actions/update.ts`), which only refreshes. It skips the call on open,
  because the page has only just read everything.

- New data arrives as props, and client state survives it: an open overlay keeps what was
  typed into it. Don't copy props into a store or `useState` to "keep them live".
- The one exception, by the owner's choice, is the navbar's `node`. `refresh()` renders
  the root layout too, which reads it and passes it to `Providers`, and
  `MainStoreProvider` follows the prop. So any page's sync updates the navbar.
- `useSyncInterval` is the one call outside a transition, on purpose: a failed background
  tick must not replace the page with `app/error.tsx`. The next tick tries again. Its one
  `.catch` is for a new build, which changes the action IDs: only a reload can fix that
  tab.
- `refresh()` is enough, because what the page reads isn't cached. The history is read
  twice per tick, by the action and by the render, which a local node doesn't notice.
- The wallet layout only hides the page behind the warning. One failed status check must
  not throw away an open overlay, and `AccountSync` is what notices the node is back.

- Every read a page or the sync waits on uses `READ_TIMEOUT`. Server Actions run one at a
  time, so a tick stuck on a hung node would hold up everything behind it.

## Route Handlers

There are none. UI data goes through Server Components, and mutations through Server
Actions, so don't add one to serve data to the client. A handler that ever has to touch an
account checks for itself, **before** anything reaches Bitcoin Core or the DB:

```ts
const account = await readActiveAccount(uuid)
if (!account) return new Response(null, { status: 404 })
```

## Special files

- `loading.tsx`: not used.
- `error.tsx`: must be `"use client"`; `reset()` retries.
- `not-found.tsx`: call `notFound()` when an ID doesn't exist, as `(wallet)/account` does
  for a `vid` it can't open. An unknown path gets the same UI from Next.js itself.
- Metadata lives in `constants/metadata.ts`. `robots` is `noindex` (private app).
