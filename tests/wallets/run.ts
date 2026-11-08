import { extendAddresses } from "./addresses"
import { showBalance } from "./balance"
import { createWallet } from "./create"
import { listWallets } from "./list"
import { loadWallets } from "./load"
import { recoverWallet } from "./recover"
import { optionsValidator } from "./shared"
import { markUsedAddresses } from "./used"

export async function runWallet(command: string, values: unknown) {
  const options = optionsValidator.parse(values)

  switch (command) {
    case "create":
      return createWallet(options)

    case "recover":
      return recoverWallet(options)

    case "addresses":
      return extendAddresses(options)

    case "load":
      return loadWallets()

    case "list":
      return listWallets()

    case "balance":
      return showBalance()

    case "used":
      return markUsedAddresses()
  }
}
