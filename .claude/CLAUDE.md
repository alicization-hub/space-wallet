# Project instructions

## This is NOT the Next.js you know

This project runs Next.js 16 — APIs, conventions, and file structure may differ from your
training data. Before writing Next.js code, read the relevant guide in the version-matched
docs bundled at `node_modules/next/dist/docs/` (`01-app/` for the App Router). Heed
deprecation notices.

## Stack & conventions

Load the project `web-stack` skill (`.claude/skills/web-stack/SKILL.md`) before writing,
editing, reviewing, or formatting any code, or running install, database, or wallet
commands. It covers the stack, folder layout, coding style, the framer-motion UI kit, auth
and security rules, and the Bitcoin wallet, with one reference file per topic under
`references/`. Where a general skill or your own habits say HeroUI or Hugeicons, this
project's skill wins.

## Project

Space is a private, self-hosted Bitcoin wallet on the owner's own Bitcoin Core full node.
It holds real funds. A mistake here can lose money for good, so treat every change to
auth, signing, or key handling as safety-critical.

- The runtime is **Bun**, not Node.js. Use `bun`, `bun run`, `bunx`.
- The app only opens on `localhost` and `127.0.0.1`, in dev and prod. It doesn't run in a
  container.
- Wallets are created and recovered from the terminal with `tests/wallet.spec.ts`, never
  through the UI.
- There is no sign-in. `/` is the node dashboard, its link opens the oldest wallet, and a
  send still needs its wallet's passphrase.

## Hard rules

- Never read or print the values in `.env`, `.env.prod`, or `certificates/`. Key names are
  in `.env.example`.
- Never run a script, a migration, or an experiment against the real database or Bitcoin
  Core unless the owner asks. Point the env at throwaway services first: see
  [testing](skills/web-stack/references/bitcoin-wallet.md#testing-without-real-funds). The
  one thing the owner allows on the real node is reading its status, as
  `tests/node.spec.ts` does.
- Never ask for, print, or log a seed phrase or a passphrase.

## Notes

- `agentRules: false` is set in `next.config.ts` so `next dev` doesn't generate
  `AGENTS.md` / `CLAUDE.md` at the project root. Keep agent instructions in this file
  instead.
