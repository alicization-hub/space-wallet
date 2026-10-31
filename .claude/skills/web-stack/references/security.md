# Security

There is no sign-in: one person uses this app, on their own machine. **What protects the
money is the passphrase.** The seed is encrypted with it, a send can't be signed without
it, and it's never stored, so even someone with a copy of the database still has to crack
argon2. Everything else here exists to keep the rest of the attack surface from undoing
that.

**Keep these true:**

1. A seed never crosses a network. It's typed in a terminal, and decrypted only on the
   server to sign.
2. Nothing returns `bio` or `passkey` to a client.
3. A send always needs its wallet's passphrase, through `checkSend`.
4. The app only answers on this machine, and only its own pages can write to it.
5. Bitcoin Core never holds a private key.

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
  active. **Check before calling the node.** A wallet name goes into the RPC URL, and
  `loadwallet` can be triggered by name. `RPCClient.setWallet` only accepts a UUID.
- `account` has no `bio` or `passkey`. Read those explicitly where they're needed.
- Wallets aren't walled off from each other. Any account opens by its URL, and that's how
  switching wallets works. Only their passphrases are separate.
- Every export of a `"use server"` file is a public endpoint for anything on this machine:
  validate its input with Zod, and return only what the UI needs.
- **A `"use cache"` function in a file a Server Component imports is public too**,
  exported or not (see [nextjs.md](nextjs.md#caching)). To see what a build really
  exposes, list `filename` and `exportedName` in
  `.next/server/server-reference-manifest.json`, without printing the `encryptionKey` next
  to them. A `$$RSC_SERVER_CACHE_*` name there is an open endpoint.

## Passphrases

- **A passphrase check must go through `checkSend`**, so it's rate-limited: 5 attempts per
  wallet per 15 minutes. It counts before verifying, so concurrent attempts can't slip
  past, and each attempt costs 64 MiB of argon2. With no sign-in in front of it, this
  limit is what stops guessing.
- The limiter is in memory: it resets on restart and assumes one server process.
- Strength rules (`passphraseValidator`) apply to new passphrases only. See
  [libraries.md](libraries.md#zod-v4).
- The passphrase is also the BIP-39 passphrase, so it can never change without moving the
  funds. See [bitcoin-wallet.md](bitcoin-wallet.md#keys).

## Don't trust the DB for addresses

The seed is encrypted, so someone who can only write to the database can't take the funds
directly. They could still swap an address, so nothing that decides where money goes
relies on a row alone:

- `createTransaction` derives the change address from the keys and refuses a mismatch.
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
  the policy is what stops an injected script from sending a passphrase away.

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
- For the same reason the scripts and the server must read the same values, or a script
  saves a wallet the server can't decrypt.
- `CIPHER_SECURITY` is the log2 of the Argon2 memory in KiB. The schema refuses less than
  15 (32 MiB).
- DB and RPC credentials have no default.
- The app must have `NEXT_PUBLIC_BASE_URL` on `https://`. It only serves HTTPS.
- `logging.serverFunctions` stays `false` in `next.config.ts`. In dev it would print every
  Server Function's arguments, including typed passphrases.

## Known limitations

- **Anything on this machine can read the wallet**, as above. It can also keep a wallet
  from sending for a while, by using up its passphrase attempts.
- **The passphrase reaches the server** to sign a send, over TLS, because signing happens
  there. The server is trusted with the seed while signing.
- **`readFees` calls mempool.space over clearnet** from the server, which reveals the
  server's IP to it when the send form opens. Nothing about the wallet is sent.
- **Explorer links go to blockchain.com**, which sees the address or transaction when
  clicked.

## Review checklist

- [ ] Every new `"use server"` export takes its account through `withAccount`, and
      validates input with Zod.
- [ ] It returns only what the UI needs.
- [ ] No secret in a return value, a log line, a cache key, an argument of a `"use cache"`
      function, or a URL.
- [ ] No new `"use server"` on a helper.
- [ ] A passphrase is only checked through `checkSend`.
- [ ] An address that money goes to is checked against the keys or the node, not just the
      DB.
- [ ] `bun audit` is clean, and the CSP still has no violations in the browser console.
