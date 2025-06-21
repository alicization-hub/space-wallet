# Project Artifact - Bitcoin Wallet.

This is a [Next.js](https://nextjs.org/) project bootstrapped with
[`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

<img src="https://img.shields.io/badge/-Next_JS-black?style=for-the-badge&logoColor=white&logo=nextdotjs&color=000000" alt="nextdotjs" />
<img src="https://img.shields.io/badge/-TypeScript-black?style=for-the-badge&logoColor=white&logo=typescript&color=3178C6" alt="typescript" />
<img src="https://img.shields.io/badge/-Tailwind_CSS-black?style=for-the-badge&logoColor=white&logo=tailwindcss&color=06B6D4" alt="tailwindcss" />

## ⚙️ Tech Stack

- [TypeScript](https://www.typescriptlang.org)
- [Next.js](https://nextjs.org)
- [HeroUI](https://www.heroui.com)
- [Framer Motion](https://www.framer.com/motion)
- [Tailwind CSS](https://tailwindcss.com)
- [Zod](https://zod.dev)
- [DrizzleORM](https://orm.drizzle.team)
- [Argon2](https://github.com/ranisalt/node-argon2)
- [@noble/*](https://paulmillr.com/noble/)
- [@scure/*](https://paulmillr.com/noble/#scure)

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
└─ services       # Services and scheduler.
└─ styles         # Stylesheet.
└─ types          # TypeScript decorators.
```

## 💽 Install dependencies

You can use one of them `yarn`, `pnpm`, `bun`, Example using `bun`:

```bash
bun install
```

## 🚀 Compiles and hot-reloads for development

```bash
bun run start:dev
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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and
contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the
[Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme)
from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
