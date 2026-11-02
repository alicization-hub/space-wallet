# Web Performance

A private wallet for one person, so correctness and security come first: every page
renders per request. Performance work here means keeping the client light and not
overloading the node.

Don't judge speed from `next dev`. Measure a production build
(`bun run build && bun run start:prod`).

## Server

- **Parallelize** independent reads with `Promise.all`, as `(wallet)/[uuid]/page.tsx`
  does.
- **Node calls are the expensive part.** `readTransactions` makes a `getrawtransaction`
  per transaction plus a batch for its parents. Keep pages small, and batch through
  `rpcClient.batch`. A page's own reads can't use `"use cache"`
  ([why](nextjs.md#caching)).
- One query per list: a join or `inArray`, never a query inside `.map()`. Index what you
  filter on.
- The `postgres` client, which holds the pool, is created once in `src/drizzle/index.ts`.
  Never create clients per request.

## Polling

A page has one timer: `useSyncInterval` calls its Server Action every 15 s while the tab
is visible, and the answer carries the page rendered fresh (see
[nextjs.md](nextjs.md#keeping-a-page-up-to-date)).

- Server Actions run one at a time per client, so a slow action delays the others. Keep
  `syncAccount` small.
- Don't add a poll: put what the page needs in its Server Components, and the sync carries
  it. Every poll also hits the node.
- **The dashboard never calls `getrawmempool true`.** That's hundreds of bytes per
  transaction on every tick, for a full mempool of them. Its fee bands come from
  `getmempoolfeeratediagram`, one small point per chunk.
- The root layout reads `readNodeInfo` for the navbar on every render, so a dashboard tick
  asks for `getblockchaininfo` and `getpeerinfo` twice. A local node doesn't notice.

## Client

- Server Components by default, with `"use client"` only on interactive leaves.
- framer-motion's features load lazily through `LazyMotion`, so use `m.*`
  ([ui-components.md](ui-components.md#how-the-pieces-fit)).
- **Keep the crypto libraries out of the browser.** `@/libs/bitcoin/unit` depends only on
  `constants.ts` for this reason. Importing `scure.ts` from a client component would add
  key derivation, the signer, and the 2048-word list to the bundle. It's also less to
  audit in the browser.
- Lazy-load what isn't needed at first paint with `next/dynamic` (`space/stars.tsx`).
- zustand: select the smallest slice.
- Check the route sizes after adding a dependency or a `"use client"` file.

## Animation

- Animate only `transform` and `opacity`.
- `space/stars.tsx` runs a canvas loop for the background. Keep it the only always-running
  script animation. The navbar's spinner also runs, but only while the node syncs.
- Prefer CSS transitions for hovers.

## Checklist

- [ ] Independent reads run in `Promise.all`; no query or RPC call per item without a
      batch.
- [ ] No new `"use client"` higher than necessary; no crypto library imported from the
      client.
- [ ] New polling has a reason, and doesn't add load on the node at rest.
- [ ] `bun run build` passes.
