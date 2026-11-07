# Security

There is no sign-in: one person uses this app, on their own machine. **What protects the
money is the passphrase.** The seed is encrypted with it, a send can't be signed without
it, and it's never stored, so even someone with a copy of the database still has to crack
argon2. **Sending happens only in the terminal** (`tests/transfer.spec.ts`), so the
passphrase and the signing stay out of the browser, HTTP, and the server that keeps
running. Everything else here exists to keep the rest of the attack surface from undoing
that.

**Keep these true:**

1. A seed or a passphrase never crosses a network. They're typed in a terminal, through
   `commandInput`, and the seed is decrypted only in a script that exits when it's done.
2. Nothing in `src/` decrypts a seed, reads `bio` or `passkey`, or signs.
3. No public endpoint starts, prepares, or changes a send.
4. Where money goes comes from what the owner types or from the keys, never from the DB.
5. What the owner approves is decoded from the signed bytes, not what was typed.
6. The app only answers on this machine, and only its own pages can write to it.
7. Bitcoin Core never holds a private key.

## What has no lock

Balances, addresses, and history open with nothing typed. Anything that can reach the port
can read them: another program on this machine, a browser extension, someone at the
keyboard. That was the owner's decision, and it holds only because the app can't be
reached from anywhere else. So never open it beyond the loopback
([deployment.md](deployment.md)): that would publish the wallet's whole history.

Anything added to a page or an action is readable the same way, so never put a secret
there.

## What keeps other sites out

A site open in the owner's browser can send requests to `localhost`. There's no session
cookie for the browser to hold back, so these do that job:

| What a site could try        | What stops it                                                                |
| ---------------------------- | ---------------------------------------------------------------------------- |
| Call a Server Action         | `src/proxy.ts`: anything but `GET` and `HEAD` needs `Origin` to match `Host` |
| Read a page by `fetch`       | The same-origin policy: the app sends no CORS headers                        |
| Embed a page or read it back | `frame-ancestors 'none'`, `X-Frame-Options`, `Cross-Origin-Resource-Policy`  |
| Rebind its name to this IP   | `src/proxy.ts` answers `421`, and the certificate doesn't match anyway       |
| Connect from another device  | The server listens on `127.0.0.1` only                                       |

- Next.js checks `Origin` itself, but lets a request through when it's missing or `null`,
  and a sandboxed iframe sends `null`. So don't remove the check from the proxy.
- **The proxy's matcher must not skip paths by file extension.** One path segment is
  enough to reach a page and its Server Actions, so `/anything.json` would get past both
  checks.

## Guarding code

| Where                                | Use                                                        |
| ------------------------------------ | ---------------------------------------------------------- |
| Server Action taking an account ID   | `withAccount(async (account, ...args) => …)`               |
| Page reading an account from its URL | `readAccount(uuid)`, then `notFound()` if there's nothing  |
| Route Handler taking an account ID   | `readActiveAccount(uuid)` → `404` if `null`                |
| `proxy.ts`                           | Other host names, writes from outside the app, and the CSP |

- `withAccount` checks that the ID is a UUID and that the account and its wallet are
  active. **Check before calling the node.** A wallet name goes into the RPC URL.
  `RPCClient.setWallet` only accepts a UUID.
- Wallets aren't walled off from each other. Any account opens by its URL, and that's how
  switching wallets works. Only their passphrases are separate.
- Every export of a `"use server"` file is a public endpoint for anything on this machine:
  validate its input with Zod, and return only what the UI needs.
- **A `"use cache"` function in a file a Server Component imports is public too**,
  exported or not (see [nextjs.md](nextjs.md#caching)). To see what a build really
  exposes, list `filename` and `exportedName` in
  `.next/server/server-reference-manifest.json`, without printing the `encryptionKey` next
  to them. A `$$RSC_SERVER_CACHE_*` name there is an open endpoint.

## Credentials

The web server runs as the owner's OS user, so whatever runs in it can read every file the
owner can. That's why the credentials that can read a seed or send are in no file:

| Credential                                    | Used by                                                                                                       | Kept in                                      |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Postgres `web_space`, RPC `rpc_space`         | The web server, `node.spec.ts`, `tx.spec.ts`, `wallet.spec.ts list` and `balance`                             | `.env`                                       |
| Postgres owner role, RPC `rpc_space_terminal` | `transfer.spec.ts`, the other `wallet.spec.ts` commands, `utils.spec.ts`, `drizzle:migrate`, `push`, `studio` | Nowhere: the terminal password, typed in use |

- `web_space` can't read `bio` or `passkey` ([database.md](database.md#roles)), and
  `rpc_space` can only read from the node
  ([bitcoin-wallet.md](bitcoin-wallet.md#rpc-users)).
- **Never put the terminal password in a file**, `.env.prod` included. Bun and Next.js
  load `.env` into the web server.
- This stops a leaked `.env`, a bug that lets a caller run SQL or RPC, and code that reads
  more than it should by mistake: that fails at once with `permission denied` or HTTP 403.
  It doesn't stop code running inside the web server: see
  [known limitations](#known-limitations).

## Passphrases

- **Typed only in a terminal and checked only in scripts.** There's no rate limit: nothing
  public can test a passphrase, and each attempt costs 64 MiB of argon2.
- Strength rules (`passphraseValidator`) apply to new passphrases only. See
  [libraries.md](libraries.md#zod-v4).
- The passphrase is also the BIP-39 passphrase, so it can never change without moving the
  funds. See [bitcoin-wallet.md](bitcoin-wallet.md#keys).

## Don't trust the DB for addresses

The seed is encrypted, so someone who can only write to the database can't take the funds
directly. They could still swap an address, so nothing that decides where money goes
relies on a row alone:

- `tests/transfers/sign.ts` derives each coin's address and the change address from the
  keys, and refuses a mismatch. A row only gives a derivation path.
- `readAddress` and `readAddresses` ask the node (`getaddressinfo`, `ismine`) before an
  address is shown for someone to pay. The node knows them from the descriptors.

Keep these when changing either path. A new way to show or pay to an address needs the
same check.

## Headers

`src/proxy.ts` sets a per-request **Content-Security-Policy**: `script-src` is only the
nonce with `'strict-dynamic'`, and there's no `'unsafe-inline'` or `'unsafe-eval'` for
scripts outside dev. `style-src` allows inline styles, because React and framer-motion
render `style` attributes. `img-src` allows `data:` for the QR code.
`frame-ancestors 'none'`, `base-uri 'none'`, `object-src 'none'`.

- A violation means a real problem, usually a prerendered page
  ([why](nextjs.md#rendering-every-page-per-request)) or a library calling `eval`.
- Adding an external script, font, or API to the browser needs a CSP change. Think twice:
  the policy is what stops an injected script from sending the wallet's data away.

`next.config.ts` sets the rest for every response: `X-Frame-Options: DENY`, `nosniff`,
`Referrer-Policy: no-referrer` (account IDs are in URLs), `Permissions-Policy`,
`Cross-Origin-Opener-Policy`, and `Cross-Origin-Resource-Policy`. There is no HSTS: the
app only runs on this machine, and browsers would remember it for every other
`http://localhost` project.

The app only opens on `localhost` and `127.0.0.1`: see [deployment.md](deployment.md).

## Env

- `CIPHER_SALT`, `CIPHER_NONCE`, `CIPHER_KEY`, `CIPHER_SECURITY`, and `CIPHER_ARGON2_*`
  shape the seed encryption and **aren't stored with the ciphertext**. Changing them makes
  every wallet undecryptable, so back them up with the database. `tests/utils.spec.ts`
  holds the re-encryption loop, disabled by default.
- For the same reason every script must read the same values, or one saves a wallet
  another can't decrypt.
- `CIPHER_SECURITY` is the log2 of the Argon2 memory in KiB. The schema refuses less than
  15 (32 MiB).
- DB and RPC credentials have no default.
- The app must have `NEXT_PUBLIC_BASE_URL` on `https://`. It only serves HTTPS.
- `logging.serverFunctions` stays `false` in `next.config.ts`. In dev it would print every
  Server Function's arguments.

## Known limitations

- **Anything on this machine can read the wallet**, as above.
- **Code running inside the web server has all the owner's rights.** The owner chose not
  to give the server its own Windows account. So it could change `tests/transfer.spec.ts`
  for the next run, log keystrokes, read `bio` through `docker exec` (the socket inside
  the container is `trust`), or change `bitcoin.conf` through `wsl.exe -u root`. Stopping
  the web server before a send only helps against code that lives in its memory.
- **`~/pg_backups` holds the ciphertext**, whatever the roles say.
- **Explorer links go to blockchain.com**, which sees the address or transaction when
  clicked. When the node doesn't answer at a broadcast, `transfer.spec.ts` prints a
  mempool.space link and doesn't open it: opening it tells that site the IP and the
  transaction ID, unless it's through Tor Browser.

## Review checklist

- [ ] Every new `"use server"` export takes its account through `withAccount`, and
      validates input with Zod.
- [ ] It returns only what the UI needs.
- [ ] No secret in a return value, a log line, a cache key, an argument of a `"use cache"`
      function, or a URL.
- [ ] No new `"use server"` on a helper.
- [ ] Nothing in `src/` reads `bio` or `passkey`, decrypts a seed, or signs.
- [ ] A new RPC call is in `rpcwhitelist`, and a new column has a grant.
- [ ] An address that money goes to is checked against the keys or the node, not just the
      DB.
- [ ] `bun audit` is clean, and the CSP still has no violations in the browser console.
