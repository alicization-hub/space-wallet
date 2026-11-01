# Running the App

Everything runs on Bun, on the owner's own machine, next to a Bitcoin Core node and
Postgres. The setup guide for WSL, Docker (for the services), Tor, and the node is
`docs/SETUP.md`. The app itself doesn't run in a container.

**The app only opens on `localhost` and `127.0.0.1`, in dev and in prod.** Don't add a
setting to open it to a network, and don't bind it to anything else. Two things enforce
this:

- The server listens on `127.0.0.1` only (`--hostname` in `start:dev`, `hostname` in
  `next-prod.ts`). Another device can't connect at all.
- `src/proxy.ts` answers `421` for any other `Host` or `X-Forwarded-Host`. That covers
  what can still reach the loopback: a tunnel, a port forward, or a browser tricked by DNS
  rebinding.

| Mode | Command                                | Listens on                                  | TLS certificate                                    |
| ---- | -------------------------------------- | ------------------------------------------- | -------------------------------------------------- |
| Dev  | `bun run start:dev`                    | `127.0.0.1:8338`                            | `certificates/localhost.pem` + `localhost-key.pem` |
| Prod | `bun run build` → `bun run start:prod` | `127.0.0.1`, port of `NEXT_PUBLIC_BASE_URL` | `certificates/localhost.pem` + `localhost-key.pem` |

- `start:prod` runs `next-prod.ts`, a custom HTTPS server, because `next start` can't
  serve HTTPS.
- `localhost` opens because it resolves to `127.0.0.1`. `[::1]` doesn't: nothing listens
  there.
- HTTPS is required, not optional: the passphrase goes through it, and a site that rebinds
  its name to this machine fails on the certificate.
- The certificate must list both names, or the browser warns on the missing one. Create it
  once:

  ```bash
  mkdir -p certificates
  mkcert -install
  mkcert -key-file certificates/localhost-key.pem -cert-file certificates/localhost.pem localhost 127.0.0.1
  ```

- `start:dev` names both files on purpose. Without them, `next dev --hostname 127.0.0.1`
  looks for the IP among the certificate's DNS names, doesn't find it, tries to create a
  new certificate with `mkcert -install`, and if that fails carries on over plain HTTP.
  With them, a missing file shows an `ENOENT` error and nothing is served.

## Rules for code

- Don't hard-code `localhost` or an IP in links or API calls. Use relative URLs, so both
  names keep working.
- **The loopback is the only lock on reading.** There is no sign-in, so a tunnel, a port
  forward, or a bind to another address would publish the wallet's whole history. A send
  still needs the passphrase. See [security.md](security.md#what-has-no-lock).
- Postgres and Bitcoin Core RPC stay on loopback or a private network. RPC credentials go
  in plain Basic auth over `RPC_PROTOCOL`, so use `https` if the node is on another
  machine.

## Backups

`backup.sh` dumps Postgres through Docker Compose into `~/pg_backups`, readable only by
the owner. It expects a `docker-compose.yml` next to it, which isn't in the repo. A dump
holds the encrypted seeds and the password hashes. To load one into a new database, follow
[database.md](database.md#re-creating-the-database). To restore a wallet you also need the
`CIPHER_*` values from `.env` (see [security.md](security.md#env)) and the passphrase, so
keep the env backed up separately from the dump. The written-down seed plus the passphrase
remain the real backup.
