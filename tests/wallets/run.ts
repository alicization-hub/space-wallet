import { extendAddresses } from "./addresses"
import { createWallet } from "./create"
import { listWallets } from "./list"
import { loadWallets } from "./load"
import { recoverWallet } from "./recover"
import { optionsValidator } from "./shared"

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
  }
}
