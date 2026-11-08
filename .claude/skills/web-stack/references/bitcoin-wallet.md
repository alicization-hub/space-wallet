# Bitcoin Wallet

The app is on **mainnet only** (`NETWORK` from `@scure/btc-signer`), with two kinds of
account: native SegWit (`m/84'/0'/n'`) and Taproot (`m/86'/0'/n'`). Bitcoin Core does the
watching, and the app does the signing.

```
terminal ──► tests/wallet.spec.ts ──► seed encrypted into wallets.bio
                                  ──► xpub descriptors imported into Bitcoin Core (one wallet per account)
                                  ──► addresses saved to Postgres

terminal ──► tests/transfer.spec.ts + passphrase ──► decrypt seed ──► sign ──► testmempoolaccept ──► approve ──► broadcast

browser  ──► balances, addresses, history. It reads, and can't send
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
- Core answers failed calls with the reason in the body, on HTTP 200 for the JSON-RPC 2.0
  that `RPCClient` sends. `call` surfaces that reason, and `batch` reports per request. A
  user calling a method outside its whitelist gets HTTP 403 with no body.
- Wallets are created with `load_on_startup=true`, because `rpc_space` can't load one
  ([RPC users](#rpc-users)).
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

## RPC users

Each user gets only what it needs (`bitcoin.conf`, with `rpcwhitelistdefault=1`):

| User                 | Who uses it                                | Calls                                                                                                                                                                                                                                                                                                       |
| -------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rpc_space`          | The web server, and scripts that only read | `getblockchaininfo`, `getnetworkinfo`, `getmempoolinfo`, `getpeerinfo`, `getnettotals`, `getnetworkhashps`, `getmempoolfeeratediagram`, `getblockhash`, `getblockheader`, `uptime`, `getrawtransaction`, `listwallets`, `getwalletinfo`, `getbalances`, `listunspent`, `listtransactions`, `getaddressinfo` |
| `rpc_space_terminal` | `transfer.spec.ts` and `wallet.spec.ts`    | `getblockchaininfo`, `listwallets`, `loadwallet`, `createwallet`, `listdescriptors`, `getdescriptorinfo`, `importdescriptors`, `getaddressinfo`, `listunspent`, `listtransactions`, `estimatesmartfee`, `testmempoolaccept`, `sendrawtransaction`                                                           |
| `__cookie__`         | `bitcoin-cli` in Ubuntu                    | `getblockchaininfo`, `getnetworkinfo`, `getpeerinfo`, `getmempoolinfo`                                                                                                                                                                                                                                      |

- **A new RPC call must go in the list**, or it gets `HTTP 403 Forbidden`, and `debug.log`
  says `RPC User rpc_space not allowed to call method <name>`. `docs/setup-guide.md` holds
  the config to change.
- **One `rpcwhitelist` line per user.** Two lines for one user keep only the methods in
  both.
- A batch with one forbidden call is refused whole, and `/wallet/<id>` is checked the same
  way.
- `rpc_space` can't call `loadwallet`, so `setWallet` fails with HTTP 403 for a wallet the
  node hasn't loaded. The page still renders, and says the node couldn't confirm the
  addresses. `bun tests/wallet.spec.ts load` fixes it.
- `getaddressinfo` and `listtransactions` hand the account's xpub to `rpc_space`
  (`parent_desc`, `parent_descs`). That reveals future addresses, not funds.

## Sending (`tests/transfer.spec.ts`)

`tests/transfers/run.ts` reads as the list of steps. The order matters, and each one
exists for a reason:

1. `requireTerminal`, then the terminal password. The node must be past `SYNCED_PROGRESS`.
2. Choose an account. Input goes through the validators in `transfers/validator.zod.ts`.
3. **Show unconfirmed sends first**, and ask before going on: sending again from other
   coins could pay twice.
4. Choose coins from `listunspent`. Recipient, amount in BTC with at most 8 decimals, fee
   rate up to `MAX_FEE_RATE`.
5. **Rows only give derivation paths.** Decrypt and derive. Each coin's address and the
   change address must match the keys, and the node must watch the change.
6. Sign (`createSignedTransaction`), wipe, before anything waits on a person. **`tx.fee`
   must be under `MAX_FEE_SATS`**, checked after signing.
7. **Decode the signed bytes.** They must spend exactly the chosen coins and pay exactly
   the recipient and the change. The review shows what was decoded.
8. `testmempoolaccept`. A wrong amount from the node fails here, on the signature.
9. Type the recipient's last 8 characters. Anything else stops without sending.
10. `sendrawtransaction`, once. An `RPCError` means nothing went out. **Any other failure
    means what the node did is unknown**: print the transaction ID, the coins, and a
    mempool.space link, and stop. The bytes are gone with the process. If it's sent again,
    it must be from the same coins, which can't pay twice.

Rules on top of the [script rules](#wallet-scripts):

- **It writes nothing to the DB.** The app's sync marks used addresses and keeps balances.
- **`toPrintable` on everything from the DB or the node before it's printed**, so an
  escape sequence can't rewrite the review.
- **Keep it plain.** One function per step, no class, no shared state, no options, no
  retry. It's the code that holds the keys, so it has to be easy to read to the end.

`components/send/index.tsx` lists these steps for the owner, so change both together.

Taproot detail: `tapInternalKey` is the **untweaked** x-only key
(`utils.pubSchnorr(privateKey)`). The key in `scriptPubKey` is already tweaked, and using
it makes the signer fail with "No taproot scripts signed".

## Units

Amounts are BTC in the RPC and what the owner types, **satoshis** everywhere else
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
bun tests/wallet.spec.ts load
bun tests/wallet.spec.ts list
bun tests/wallet.spec.ts balance
bun tests/wallet.spec.ts used
```

| Command     | What it does                                                                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `create`    | Generates a seed, shows it once, clears the screen and scrollback, asks back 4 words, sets a passphrase. `--started-at` isn't needed: it starts now                                   |
| `recover`   | Takes a seed and its original passphrase. Shows the first addresses to confirm. Rescans the whole chain unless given `--started-at`                                                   |
| `addresses` | Generates the next batch for a wallet's accounts, on the node first, then in the DB                                                                                                   |
| `load`      | Loads every active account's Core wallet, and keeps it loaded across restarts                                                                                                         |
| `list`      | Wallets and accounts, nothing secret. Doesn't ask for the terminal password                                                                                                           |
| `balance`   | Asks for an account, saves its balance from the node to the DB, and prints it in BTC and sats. Doesn't ask for the terminal password                                                  |
| `used`      | Asks for an account, reads its whole history from the node 10 transactions at a time, and marks the addresses its confirmed ones touch as used. Doesn't ask for the terminal password |

Rules for these scripts:

- **Secrets only through `commandInput`**, hidden by default. Never as an argument, which
  stays in the shell history.
- **`askTerminalCredentials` comes before anything that reads the env.** `@/constants/env`
  reads it once, on first import, so the entry file imports the rest with `await import`.
- **`requireTerminal()` before printing anything secret.** It refuses pipes on both ends,
  so a seed can't land in a file through `… | tee out.log`.
- **Print a query error's `cause.message`, nothing more.** Drizzle's message repeats the
  statement, and the driver's `cause.parameters` holds every value it was given, `bio` and
  `passkey` included (`describeError` in `cmd.spec.ts`).
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
  hides real bugs: the error in the body, ranges topped up to the keypool on import, the
  "new range must include current range" refusal, `next_index` moved by a rescan, `ismine`
  worked out from the imported descriptors, `-18` for an unloaded wallet.
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

- Decode what was broadcast: the recipient's amount, the change address, and the fee, for
  both SegWit and Taproot, with real Core judging the signatures.
- Each of these ends with nothing broadcast: a wrong passphrase, approval, or terminal
  password, a row that doesn't match the keys, a coin spent meanwhile, a wrong amount from
  the node, a fee over either limit, and a pipe on stdin.
- A broadcast the node refuses, and one it never answers, whether or not it got the
  transaction. `sendrawtransaction` must be asked once.
- Replay a call to a Server Action with no `Origin`, `Origin: null`, and another site's,
  on the page and on a path like `/anything.json`. Each must be refused with nothing
  reaching the node.
- What a build exposes: the manifest must list only `readAddress`, `readAddresses`,
  `syncAccount`, and `syncNode`, and `.next/server` must not hold
  `Invalid mnemonic phrase`.

**Real Core without real funds.** `bitcoind -regtest` with its own datadir and ports, no
peers, takes the app's signed transactions through `testmempoolaccept`, which runs the
real script checks. The app only speaks mainnet address formats, but scripts and
signatures are the same on any chain: convert `bc1` ↔ `bcrt1` at the edges and `xpub` →
`tpub` in the descriptors, and mine to the converted addresses. A small proxy in front of
Core can do that for a whole script, and fail on purpose at the broadcast. Signed bytes
pass through it untouched. This has run against Core 31.2 for SegWit and Taproot, and the
owner considers it enough for now: no real send is needed.

Set up the same users as the real node, so a call outside a whitelist fails here too. For
the roles, use a throwaway `postgres:17-alpine` container: PGlite has no real logins.

A fake node can't prove what only real Core does, like policy rules or an actual rescan.
For a change in that area, use regtest.
