import { randomInt } from "crypto"

import { Mnemonic } from "@/libs/bitcoin/mnemonic"
import { createRootKey } from "@/libs/bitcoin/scure"
import { Cipher } from "@/libs/cipher"
import { logger } from "@/libs/logger"
import { hashPassword } from "@/libs/password"

import { commandInput, requireTerminal } from "../cmd.spec"
import {
  createSeedPlan,
  promptNewPassphrase,
  provisionWallet,
  reportWallet,
  requireFreeName,
  type OptionsValidator
} from "./shared"

/**
 * How many words are asked back to prove the seed was written down.
 */
const CHECKED_WORDS = 4

/**
 * Removes the seed from the screen and from the terminal's scrollback.
 */
function clearScreen() {
  process.stdout.write("\x1b[2J\x1b[3J\x1b[H")
}

function pickPositions(length: number) {
  const positions = new Set<number>()
  while (positions.size < CHECKED_WORDS) {
    positions.add(randomInt(length))
  }

  return [...positions].sort((a, b) => a - b)
}

/**
 * Generates a new seed, shows it once, makes sure it was written down, and sets up the wallet.
 *
 * Nothing is saved until the end, so stopping at any point leaves no trace.
 */
export async function createWallet(options: OptionsValidator) {
  requireTerminal()

  const { name, slug } = await requireFreeName(options.name)

  const phrase = Mnemonic.generate(options.words as MnemonicLength)
  const words = phrase.split(" ")

  logger("🚫 Write these words down, in order, and keep them offline.")
  logger("🚫 Anyone with them can take the funds. They will not be shown again.")
  console.info(
    `\n${words.map((word, index) => `${String(index + 1).padStart(2)}. ${word}`).join("\n")}\n`
  )

  await commandInput("Press Enter once you have written them down")
  clearScreen()

  for (const position of pickPositions(words.length)) {
    const answer = await commandInput(`Word #${position + 1}`, { isHidden: false })
    if (answer.trim().toLowerCase() !== words[position]) {
      throw new Error(
        "That word doesn't match. Nothing was saved. Run the command again for a new seed."
      )
    }
  }

  clearScreen()

  logger("🚫 The passphrase is part of the key (BIP-39), not only a login.")
  logger("🚫 It can't be changed, and the seed alone can't recover the funds without it.")

  const passphrase = await promptNewPassphrase()

  logger("🔐 Encrypting the seed...")
  const rootKey = await createRootKey(phrase, passphrase)
  const plans = [
    createSeedPlan(rootKey, 84, options.account ?? 0),
    createSeedPlan(rootKey, 86, options.account ?? 0)
  ]

  const startedAt = new Date()

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
