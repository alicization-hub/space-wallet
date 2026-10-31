import { Mnemonic } from "@/libs/bitcoin/mnemonic"
import { createRootKey } from "@/libs/bitcoin/scure"
import { Cipher } from "@/libs/cipher"
import { logger } from "@/libs/logger"
import { hashPassword } from "@/libs/password"
import { passphraseInputValidator } from "@/libs/validator.zod"

import { commandConfirm, commandInput } from "../cmd.spec"
import {
  createSeedPlan,
  provisionWallet,
  reportWallet,
  requireFreeName,
  type OptionsValidator
} from "./shared"

/**
 * Sets up a wallet from an existing seed.
 *
 * The passphrase here must be the original one, because it is part of the key. Today's strength
 * rules don't apply, and a different passphrase wouldn't fail: it would quietly open an empty
 * wallet. So the first addresses are shown for the owner to compare before anything is saved.
 */
export async function recoverWallet(options: OptionsValidator) {
  const { name, slug } = await requireFreeName(options.name)

  logger("⌨️ The seed is not shown while you type.")
  const input = await commandInput("🌱 Seed phrase")
  const phrase = input.trim().toLowerCase().split(/\s+/).join(" ")

  if (!Mnemonic.validate(phrase)) {
    throw new Error("That isn't a valid BIP-39 seed phrase. Nothing was saved.")
  }

  const passphrase = passphraseInputValidator.parse(
    await commandInput("🔑 The wallet's passphrase")
  )
  if ((await commandInput("🔑 Confirm passphrase")) !== passphrase) {
    throw new Error("The passphrases do not match. Nothing was saved.")
  }

  const rootKey = await createRootKey(phrase, passphrase)
  const plans = [
    createSeedPlan(rootKey, 84, options.account ?? 0),
    createSeedPlan(rootKey, 86, options.account ?? 0)
  ]

  for (const plan of plans) {
    logger(`📬 First ${plan.purpose} address: ${plan.createAddress(0, false)}`)
  }

  if (!(await commandConfirm("Do these match the wallet you are recovering?"))) {
    throw new Error("Nothing was saved. Check the seed phrase and the passphrase.")
  }

  // The start of time: without a date, the whole chain is scanned
  const startedAt = options["started-at"] ?? new Date(0)

  logger(
    "⏳ Bitcoin Core rescans the chain now. This can take hours: keep this window open."
  )

  await provisionWallet(
    {
      name,
      slug,
      bio: await Cipher.encrypt(phrase, passphrase),
      passkey: await hashPassword(passphrase)
    },
    plans,
    startedAt
  )

  reportWallet(slug, plans, startedAt)
  rootKey.wipePrivateData()
}
