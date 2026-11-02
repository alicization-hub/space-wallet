import { logger } from "@/libs/logger"

import { askTerminalCredentials, describeError, requireTerminal } from "./cmd.spec"

/**
 * Sends bitcoin. This is the only way to send: the passphrase and the signing stay out of the
 * browser, HTTP, and the server that keeps running.
 *
 * Usage (from the repo root, in a real terminal):
 * ```bash
 * bun tests/transfer.spec.ts
 * ```
 */
async function main() {
  requireTerminal()
  await askTerminalCredentials()

  // Imported here, not at the top: see askTerminalCredentials
  const { db } = await import("@/drizzle")
  const { runTransfer } = await import("./transfers/run")

  await runTransfer().finally(() => db.$client.end())
}

main()
  .catch((error) => {
    logger(`🚫 ${describeError(error)}`)
    process.exitCode = 1
  })
  .finally(() => {
    // Ending the process is what clears the passphrase and the mnemonic from memory
    process.exit()
  })
