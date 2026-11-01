# Bitcoin Wallet

The app is on **mainnet only** (`NETWORK` from `@scure/btc-signer`), with two kinds of
account: native SegWit (`m/84'/0'/n'`) and Taproot (`m/86'/0'/n'`). Bitcoin Core does the
watching, and the app does the signing.

```
terminal ──► tests/wallet.spec.ts ──► seed encrypted into wallets.bio
                                  ──► xpub descriptors imported into Bitcoin Core (one wallet per account)
                                  ──► addresses saved to Postgres

browser  ──► createTransaction + passphrase ──► decrypt seed ──► sign here ──► testmempoolaccept ──► broadcast
```

## Keys

- `wallets.bio` is the seed, encrypted with XChaCha20-Poly1305 under an Argon2id key
  derived from the passphrase (`Cipher.encrypt`). `wallets.passkey` is an argon2id hash of
  the same passphrase.
- **The passphrase is also the BIP-39 passphrase**
  (`createRootKey(mnemonic, passphrase)`). So:
  - It can't be changed without moving the funds to a new wallet.
  - The seed alone doesn't recover the funds.
  - A different passphrase doesn't fail: it derives a different, empty wallet. That's why
    `recover` shows the first addresses and asks before saving.
- Zero what you can when done (`rootKey.wipePrivateData()`, `privateKey.fill(0)`), and
  never log any of it.

A wallet always holds a seed. There are no watch-only wallets or hardware signers.

## Bitcoin Core

- Each account has its own Core wallet named after `accounts.id`, created with
  `disable_private_keys=true`. Core only ever sees xpub descriptors.
- `RPCClient` (`libs/bitcoin/rpc.ts`) is the only way to the node. `setWallet` takes a
  UUID, because the name goes into the URL.
- Core answers failed calls with HTTP 500 and the reason in the body. `call` surfaces that
  reason, and `batch` reports per request.
- `importdescriptors` only answers once its rescan has finished, which can take hours.
  Pass a long `timeout` for it.
- **The range moves on its own.** Core tops an active descriptor up to its keypool size
  (1000 by default) on import, and refuses a new range that doesn't include the current
  one. So `watchAddresses` reads `listdescriptors` and imports only a chain that doesn't
  cover the target, with a range from 0.
- **`next_index` moves too.** A rescan advances it past the addresses it finds used, so
  `provisionWallet` and `addresses` generate rows up to it. Without rows, those coins show
  in the balance but can't be spent from the app.
- `getaddressinfo` tells whether the wallet's descriptors cover an address (`ismine`).
  It's how the scripts prove the node watches what the keys derive, and how the app checks
  an address before showing it.
- Wallets are created with `avoid_reuse=false`: Core's coin selection isn't used, and that
  flag would hide coins on reused addresses from the balance.
- Balances come from `getbalances`. Since Core 30, `getwalletinfo` no longer has them.
- The history needs `txindex=1`: `getrawtransaction` can't find a confirmed transaction
  without it. A transaction the node refuses to read still gets a row, from what
  `listtransactions` knows.
- UTXOs of a watch-only Core wallet report `spendable: false`. That's about Core having no
  keys: the app signs them anyway.

## Addresses

`GAP_LIMIT` (23) means indexes `0..=23` on each chain per batch. The app hands out the
lowest unused `receive` address. An address is marked `isUsed` once a confirmed
transaction touches it (`markAddressesUsed`). When none are left, the UI asks the owner to
run the `addresses` script.

`libs/bitcoin/scure.ts` derives the addresses from a root key, and
`libs/bitcoin/descriptor.ts` gives the node the matching descriptors. **They must agree**:
if you change one, compare them for both purposes and both chains.

## Sending (`transaction/create.ts`)

The order matters, and each step exists for a reason:

1. `withAccount`: a valid, active account of an active wallet.
2. Validate with `createValidator`. The fee rate is capped (`MAX_FEE_RATE`), UTXOs are
   capped and unique.
3. `checkSend`, rate-limited.
4. Find an unused change address, or fail with the command to run.
5. **Every selected UTXO must still be unspent, on an address of this account.** Never
   skip one silently: that would build a different transaction from the one the user
   confirmed.
6. Decrypt and derive. **The change address must match the keys**, because the DB alone
   could redirect the change.
7. Sign (`createSignedTransaction`), wipe.
8. **`tx.fee` must be under `MAX_FEE_SATS`**. This runs after signing, as the last check
   on the real transaction.
9. `testmempoolaccept`, then `sendrawtransaction`. If the node doesn't answer, the
   transaction may still have gone out, so return `isUnknown` with its txid: sending again
   from other coins would pay twice. The form closes and the message stays on screen. Only
   an `RPCError` is a real refusal.

Taproot detail: `tapInternalKey` is the **untweaked** x-only key
(`utils.pubSchnorr(privateKey)`). The key in `scriptPubKey` is already tweaked, and using
it makes the signer fail with "No taproot scripts signed".

## Units

Amounts are BTC in the RPC and the send form, **satoshis** everywhere else
(`Account.Balance`, `Transaction.Schema`). Convert with `bitcoinToSats` / `satsToBitcoin`
from `libs/bitcoin/unit.ts`. Compute in satoshis, because floats can't hold BTC exactly.
`unit.ts` is safe in client components.

## Wallet scripts

`tests/wallet.spec.ts` is the only way to create a wallet. Run it from the repo root in a
real terminal: it refuses a pipe. In Git Bash, prefix it with `winpty`.

```bash
bun tests/wallet.spec.ts create --name "Cold Storage" [--words 12|24] [--account 0]
bun tests/wallet.spec.ts recover --name "Old Wallet" [--started-at 2021-03-01] [--account 0]
bun tests/wallet.spec.ts addresses --wallet cold-storage [--account 0]
bun tests/wallet.spec.ts list
```

| Command     | What it does                                                                                                                                        |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `create`    | Generates a seed, shows it once, clears the screen and scrollback, asks back 4 words, sets a passphrase. `--started-at` isn't needed: it starts now |
| `recover`   | Takes a seed and its original passphrase. Shows the first addresses to confirm. Rescans the whole chain unless given `--started-at`                 |
| `addresses` | Generates the next batch for a wallet's accounts, on the node first, then in the DB                                                                 |
| `list`      | Wallets and accounts, nothing secret                                                                                                                |

Rules for these scripts:

- **Secrets only through `commandInput`**, hidden by default. Never as an argument, which
  stays in the shell history.
- **`requireTerminal()` before printing anything secret.** It refuses pipes on both ends,
  so a seed can't land in a file through `… | tee out.log`.
- **Print a query error's `cause.message`, nothing more.** Drizzle's message repeats the
  statement, and the driver's `cause.parameters` holds every value it was given, `bio` and
  `passkey` included (`describeError` in `wallet.spec.ts`).
- **The node first, then the DB** (`provisionWallet`). A wallet in the DB is always fully
  set up, and a failure leaves only an unused watch-only Core wallet, which holds no keys.
  Running again is safe.
- The first addresses are shown before anything is saved, so the owner can compare them.
- They import `@/libs/*` but nothing with `server-only`.

## Testing without real funds

Never test against the real database or node, apart from reading the node's status as
`tests/node.spec.ts` does. There's no test runner, so to check a change end to end, build
this outside the repo (the scratchpad, for instance):

- **Postgres**: `@electric-sql/pglite` + `@electric-sql/pglite-socket` on a spare port,
  with `src/drizzle/migrations/*/migration.sql` applied. For `drizzle-kit` itself, write a
  config in the scratchpad holding only the throwaway URL and run it from there, where no
  `.env` gets loaded. To see what a change does to the real database's shape, build a copy
  from the old schema with `git show`.
- **Bitcoin Core**: a small `Bun.serve` answering the JSON-RPC methods `RPCClient` calls,
  recording them, and serving seeded `listunspent` / `listtransactions`. **Check its
  answers against `help <method>` on the real node**, which only reads documentation: a
  fake that still sent `getwalletinfo.balance` once hid a bug that real Core would have
  hit on the first page load. Keep Core's real behaviours, because a fake that's too kind
  hides real bugs: HTTP 500 with the error in the body, ranges topped up to the keypool on
  import, the "new range must include current range" refusal, `next_index` moved by a
  rescan, `ismine` worked out from the imported descriptors, `-18` for an unloaded wallet.
- **Env**: export `DB_*`, `RPC_*`, `CIPHER_*`, and `NEXT_PUBLIC_BASE_URL` in the shell.
  Bun and Next.js let the environment win over `.env`. **Have the test abort unless
  `DATABASE_URL` and `RPC.port` point at the throwaway services.**
- **Scripts**: call the functions in `tests/wallets/*.ts` directly, with a fake
  `process.stdin` (`isTTY: true`, `setRawMode`, emit `"data"`). For a real terminal, drive
  `bun tests/wallet.spec.ts` through `@lydell/node-pty`. ConPTY repaints the screen, so
  don't expect printed lines to survive intact.
- **Browser**: `playwright-core` with `channel: "chrome"`, against `bun run start:prod`.
  Listen for `securitypolicyviolation` and page errors.

What's worth proving on any change that touches them:

- Decode what was broadcast: the recipient's amount, the change address, the fee, and
  every input's signature (`tx.preimageWitnessV0` / `preimageWitnessV1`) for both SegWit
  and Taproot.
- Replay a captured send, with the right passphrase in it, with no `Origin`,
  `Origin: null`, and another site's, on the page and on a path like `/anything.json`.
  Each must be refused with nothing reaching the node.

**Real Core without real funds.** `bitcoind -regtest` with its own datadir and ports, no
peers, takes the app's signed transactions through `testmempoolaccept`, which runs the
real script checks. The app only speaks mainnet address formats, but scripts and
signatures are the same on any chain: convert `bc1` ↔ `bcrt1` at the edges and `xpub` →
`tpub` in the descriptors, and mine to the converted addresses. This has run against Core
31.2 for SegWit and Taproot, and the owner considers it enough for now: no real send is
needed.

A fake node can't prove what only real Core does, like policy rules or an actual rescan.
For a change in that area, use regtest.
