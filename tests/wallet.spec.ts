import { parseArgs } from "util"

import { DrizzleQueryError } from "drizzle-orm"

import { db } from "@/drizzle"
import { logger } from "@/libs/logger"

import { extendAddresses } from "./wallets/addresses"
import { createWallet } from "./wallets/create"
import { listWallets } from "./wallets/list"
import { recoverWallet } from "./wallets/recover"
import { optionsValidator } from "./wallets/shared"

const USAGE = `
Usage: bun tests/wallet.spec.ts <command> [options]

  create    --name <name> [--words 12|24] [--account <n>]
            Generates a new seed, shows it once, and sets up the wallet.

  recover   --name <name> [--started-at YYYY-MM-DD] [--account <n>]
            Sets up a wallet from an existing seed. Without --started-at it rescans the whole chain.

  addresses --wallet <name> [--account <n>]
            Generates the next batch of addresses for a wallet's accounts.

  list      Shows the wallets and their accounts.

Seeds and passphrases are always asked for in the terminal, never taken as arguments.
`

/**
 * Wallets are managed from the terminal instead of the UI, so a seed never passes through a
 * browser, an extension, or a network request.
 */
async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      "name": { type: "string" },
      "words": { type: "string" },
      "account": { type: "string" },
      "started-at": { type: "string" },
      "wallet": { type: "string" }
    }
  })

  const options = optionsValidator.parse(values)

  switch (positionals[0]) {
    case "create":
      return createWallet(options)

    case "recover":
      return recoverWallet(options)

    case "addresses":
      return extendAddresses(options)

    case "list":
      return listWallets()

    default:
      console.info(USAGE)
  }
}

/**
 * A failed query's own message lists its parameters, which can include `bio` and `passkey`. Only
 * the reason is shown.
 */
function describeError(error: unknown) {
  if (error instanceof DrizzleQueryError) {
    return `The database refused the change: ${error.cause?.message}`
  }

  return error instanceof Error ? error.message : String(error)
}

main()
  .catch((error) => {
    logger(`❌ ${describeError(error)}`)
    process.exitCode = 1
  })
  .finally(async () => {
    await db.$client.end()
    process.exit()
  })
