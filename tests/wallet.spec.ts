import { parseArgs } from "util"

import { logger } from "@/libs/logger"

import { askTerminalCredentials, describeError, requireTerminal } from "./cmd.spec"

const COMMANDS = ["create", "recover", "addresses", "load", "list"]

const USAGE = `
Usage: bun tests/wallet.spec.ts <command> [options]

  create    --name <name> [--words 12|24] [--account <n>]
            Generates a new seed, shows it once, and sets up the wallet.

  recover   --name <name> [--started-at YYYY-MM-DD] [--account <n>]
            Sets up a wallet from an existing seed. Without --started-at it rescans the whole chain.

  addresses --wallet <name> [--account <n>]
            Generates the next batch of addresses for a wallet's accounts.

  load      Loads the node's wallets, and keeps them loaded across restarts.

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

  const command = positionals[0]

  if (!COMMANDS.includes(command)) {
    console.info(USAGE)
    return
  }

  // `list` shows nothing secret, so the web's credentials are enough for it
  if (command !== "list") {
    requireTerminal()
    await askTerminalCredentials()
  }

  // Imported here, not at the top: see askTerminalCredentials
  const { db } = await import("@/drizzle")
  const { runWallet } = await import("./wallets/run")

  await runWallet(command, values).finally(() => db.$client.end())
}

main()
  .catch((error) => {
    logger(`🚫 ${describeError(error)}`)
    process.exitCode = 1
  })
  .finally(() => {
    process.exit()
  })
