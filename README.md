# Project Space - Bitcoin Wallet.

#### This is a private, web-based Bitcoin wallet application built primarily with Next.js 16. It prioritizes user control and privacy, designed to run with own **Bitcoin Core full node**.

_This project was developed through collaboration between developers and generative AI
tools, including `Grok AI`, `Gemini Pro`, `GitHub Copilot`, `ChatGPT`, `Claude AI`,
`DeepSeek AI`, and `Windsurf`. I then refined and optimized the code for enhanced
performance._

### ✨ Features

Here are the initial features implemented, with more planned for future updates:

- **Secure Key Management**: Generate mnemonics, build custom derivation paths, and create
  `xpub` descriptors only for wallet accounts. Wallets are managed from the terminal, so a
  seed never passes through a browser.
- **Transaction History**: View a clear and concise history of your Bitcoin transactions.
- **Send/Receive Functionality**: Receive from the wallet page, and send from the
  terminal, so the passphrase and the signing stay out of the browser.

---

<img src="https://img.shields.io/badge/-Next_JS-black?style=for-the-badge&logoColor=white&logo=nextdotjs&color=000000" alt="nextdotjs" />
<img src="https://img.shields.io/badge/-TypeScript-black?style=for-the-badge&logoColor=white&logo=typescript&color=3178C6" alt="typescript" />
<img src="https://img.shields.io/badge/-Tailwind_CSS-black?style=for-the-badge&logoColor=white&logo=tailwindcss&color=06B6D4" alt="tailwindcss" />

### ⚙️ Tech Stack

- **Runtime:**
  - [Bun](https://bun.sh) replaces Node.js, for both the app and the package manager.

- **Framework:**
  - [Next.js 16](https://nextjs.org/docs)
    - Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment)
      for more details.

- **User Interface:**
  - [Tailwind CSS](https://tailwindcss.com)
  - [Framer Motion](https://www.framer.com/motion), with the project's own components in
    `src/components/ui`.

- **Cryptographic Libraries:**
  - `@noble/*` (e.g., `@noble/ciphers`, `@noble/hashes`) for cryptographic operations.
  - `@scure/*` (e.g., `@scure/bip39`) for BIP-39 mnemonic generation.
  - Argon2id for secure keys, through `Bun.password` and `@noble/hashes`.

- **Database:**
  - [DrizzleORM](https://orm.drizzle.team)
  - `pg` (PostgreSQL) - running on WSL2 Ubuntu for locally.

- **Bitcoin Core Integration**: Connects to **Bitcoin Core Full Node** for direct
  interaction with the Bitcoin network.

- **Privacy**: Integrated with **Tor** for enhanced privacy when communicating with
  **Bitcoin Core Full Node**.

## 🧩 VS Code Extensions

- [React](https://marketplace.visualstudio.com/items?itemName=dsznajder.es7-react-js-snippets)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [Tailwind CSS](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

## 📋 Directory Structure

```
src               # App entry point.
└─ actions        # Server Actions and server-only helpers.
└─ app            # App Router.
└─ components     # Shared components.
└─ constants      # Constant variable.
└─ drizzle        # Database client, schema and migrations.
└─ hooks          # Customs hooks.
└─ libs           # Libraries, utilities.
└─ stores         # Client state.
└─ styles         # Stylesheet.
└─ types          # TypeScript decorators.
tests             # Maintenance scripts, including wallet management.
```

## 🚀 Getting Started

More detailed setup instructions will be provided soon. In the meantime, here's a brief
overview of what you'll need:

1. **Bitcoin Core Full Node**: Ensure you have a synced _Bitcoin Core full node_ running
   with `txindex=1`, preferably configured to accept connections over _Tor_. The app shows
   a warning instead of the wallet until it has passed 97%.

2. **PostgreSQL Database**: Set up a PostgreSQL database instance. For locally use _WSL2
   Ubuntu_.

3. **Dependencies**: Install [Bun](https://bun.sh) 1.4, then the project dependencies:

```bash
bun install
```

4. **Environment Variables**: Copy `.env.example` to `.env` and fill it in. The app
   refuses to start without the database and Bitcoin Core RPC credentials. `.env` holds
   only what the web server needs: the terminal password, which unlocks the database's
   owner role and the node's `rpc_space_terminal` user, is in no file. See
   `docs/setup-guide.md`.

5. **HTTPS Certificate**: `start:dev` and `start:prod` both read
   `certificates/localhost.pem` and `certificates/localhost-key.pem`. Create them once
   with [mkcert](https://github.com/FiloSottile/mkcert). The app only serves HTTPS, and
   only on this machine.

   ```bash
   mkdir -p certificates
   mkcert -install
   mkcert -key-file certificates/localhost-key.pem -cert-file certificates/localhost.pem localhost 127.0.0.1
   ```

## 👛 Wallets

Wallets are created and recovered from the terminal, never through the UI. Run these from
the repository root in a real terminal: seeds and passphrases are asked for there and are
never arguments.

```bash
bun tests/wallet.spec.ts create --name "My Wallet"         # generate a new seed
bun tests/wallet.spec.ts recover --name "Old Wallet"       # from an existing seed
bun tests/wallet.spec.ts addresses                         # generate more addresses
bun tests/wallet.spec.ts load                              # load the node's wallets
bun tests/wallet.spec.ts list                              # show the wallets
bun tests/wallet.spec.ts balance                           # show and save an account's balance
bun tests/wallet.spec.ts used                              # mark the addresses in its history used
```

There is no sign-in: `/` shows the node, and its link opens the oldest wallet. Anything on
this machine can read balances and history, so never expose the port beyond it.

The passphrase is also the BIP-39 passphrase: it can't be changed, and the seed alone
can't recover the funds without it.

## 💸 Sending

Bitcoin is sent only from the terminal, with one command that never changes and takes no
arguments. The wallet page's send button only explains these steps.

```bash
bun tests/transfer.spec.ts
```

It asks for the terminal password, then the account, coins, recipient, amount, fee rate,
and passphrase. It signs and tests the transaction, shows what the signed bytes really do,
and sends only after you type the recipient's last 8 characters.

If the node doesn't answer at the end, the script says so and stops, because the
transaction may or may not have gone out. Search for its ID on
[mempool.space](https://mempool.space) or another block explorer, and run the script again
to check before sending anything else.

## 🚀 Compiles and hot-reloads for development

```bash
bun run start:dev
```

Open [https://localhost:8338](https://localhost:8338) with your browser to see the result.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization)
to automatically optimize and load Ubuntu and Inconsolata, custom Google Fonts.

## 📦 Compiles and minifies for production

```bash
bun run build
bun run start:prod
```

The app only opens on `localhost` and `127.0.0.1`, in development and in production. It
listens on `127.0.0.1`, at port 8338 in development and at the port of
`NEXT_PUBLIC_BASE_URL` in production, and refuses any other host name.
