# Project Space - Bitcoin Wallet.

#### This is a private, web-based Bitcoin wallet application built primarily with Next.js 15. It prioritizes user control and privacy, designed to run with own **Bitcoin Core full node**.

_This project was developed through collaboration between developers and generative AI tools, including
`Grok AI`, `Gemini Pro`, `GitHub Copilot`, `ChatGPT`, `Claude AI`, `DeepSeek AI`, and `Windsurf`. I then
refined and optimized the code for enhanced performance._

### ✨ Features

Here are the initial features implemented, with more planned for future updates:

- **Secure Key Management**: Generate mnemonics, build custom derivation paths, and create `xpub` descriptors
  only for wallet accounts.
- **Transaction History**: View a clear and concise history of your Bitcoin transactions.
- **Send/Receive Functionality**: Easily send and receive Bitcoin directly from wallet.

---

<img src="https://img.shields.io/badge/-Next_JS-black?style=for-the-badge&logoColor=white&logo=nextdotjs&color=000000" alt="nextdotjs" />
<img src="https://img.shields.io/badge/-TypeScript-black?style=for-the-badge&logoColor=white&logo=typescript&color=3178C6" alt="typescript" />
<img src="https://img.shields.io/badge/-Tailwind_CSS-black?style=for-the-badge&logoColor=white&logo=tailwindcss&color=06B6D4" alt="tailwindcss" />

### ⚙️ Tech Stack

- **Framework:**
  - [Next.js 15](https://nextjs.org/docs)
    - Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

- **User Interface:**
  - [HeroUI](https://www.heroui.com)
  - [Tailwind CSS](https://tailwindcss.com)
  - [Framer Motion](https://www.framer.com/motion)

- **Cryptographic Libraries:**
  - `@noble/*` (e.g., `@noble/secp256k1`, `@noble/hashes`) for cryptographic operations.
  - `@scure/*` (e.g., `@scure/bip39`) for BIP-39 mnemonic generation.
  - `Argon2` for secure keys.

- **Database:**
  - [DrizzleORM](https://orm.drizzle.team)
  - `pg` (PostgreSQL) - running on WSL2 Ubuntu for locally.

- **Bitcoin Core Integration**: Connects to **Bitcoin Core Full Node** for direct interaction with the Bitcoin
  network.

- **Privacy**: Integrated with **Tor** for enhanced privacy when communicating with **Bitcoin Core Full
  Node**.

## 🧩 VS Code Extensions

- [React](https://marketplace.visualstudio.com/items?itemName=dsznajder.es7-react-js-snippets)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [Tailwind CSS](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

## 📋 Directory Structure

```
src               # App entry point.
└─ app            # App Router.
└─ components     # Shared components.
└─ constants      # Constant variable.
└─ hooks          # Customs hooks.
└─ libs           # Libraries, utilities.
└─ styles         # Stylesheet.
└─ tasks          # Tasks scheduler.
└─ types          # TypeScript decorators.
```

## 🚀 Getting Started

More detailed setup instructions will be provided soon. In the meantime, here's a brief overview of what
you'll need:

1. **Bitcoin Core Full Node**: Ensure you have a synced _Bitcoin Core full node_ running, preferably
   configured to accept connections over _Tor_.

2. **PostgreSQL Database**: Set up a PostgreSQL database instance. For locally use _WSL2 Ubuntu_.

3. **Dependencies**: Install project dependencies using your preferred package manager, use one of them
   `yarn`, `pnpm`, `bun`, Example using `bun`:

```bash
bun install
```

4. **Environment Variables**: Configure your environment variables for database connection, Bitcoin Core RPC,
   and Tor.

## 🚀 Compiles and hot-reloads for development

```bash
bun run start:dev --port 8338
```

Open [http://localhost:8338](http://localhost:8338) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically
optimize and load Inter, a custom Google Font.

### Setup pnpm (optional)

If you are using `pnpm`, you need to add the following code to your `.npmrc` file:

```bash
public-hoist-pattern[]=*@heroui/*
```

After modifying the `.npmrc` file, you need to run `pnpm install` again to ensure that the dependencies are
installed correctly.

## 📦 Compiles and minifies for production

```bash
bun run build
```

## 🛑 Disclaimer

This is a private project. If you encounter any issues, please fix them yourself. Once you've successfully
resolved something, do let me know!
