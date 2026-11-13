import { and, desc, eq } from "drizzle-orm"

import { db, schema } from "@/drizzle"
import { GAP_LIMIT } from "@/libs/bitcoin/constants"
import { createRootKey } from "@/libs/bitcoin/scure"
import { Cipher } from "@/libs/cipher"
import { logger } from "@/libs/logger"
import { verifyPassword } from "@/libs/password"
import { passphraseInputValidator } from "@/libs/validator.zod"

import { commandInput, toPrintable } from "../cmd.spec"
import { chooseAccount, chooseWallet } from "../transfers/ask"
import {
  createAddressRows,
  createSeedPlan,
  readNextIndex,
  watchAddresses
} from "./shared"

/**
 * Generates the next batch of addresses for one account. Run it when the app says no unused address
 * is left.
 */
export async function extendAddresses() {
  const { id: walletId } = await chooseWallet()
  const account = await chooseAccount({
    walletId,
    description: "Type the number of the account that needs more addresses."
  })

  const [wallet] = await db
    .select({ bio: schema.wallets.bio, passkey: schema.wallets.passkey })
    .from(schema.wallets)
    .where(eq(schema.wallets.id, walletId))

  const passphrase = passphraseInputValidator.parse(
    await commandInput({
      label: "Passphrase",
      description: "The wallet's passphrase, to derive the new addresses."
    })
  )
  if (!(await verifyPassword(passphrase, wallet.passkey))) {
    throw new Error("Invalid passphrase.")
  }

  const mnemonic = await Cipher.decrypt(wallet.bio, passphrase)
  const rootKey = await createRootKey(mnemonic, passphrase)
  const plan = createSeedPlan(rootKey, account.purpose, account.index)

  try {
    const [last] = await db
      .select({ index: schema.addresses.index })
      .from(schema.addresses)
      .where(
        and(
          eq(schema.addresses.accountId, account.id),
          eq(schema.addresses.type, "receive")
        )
      )
      .orderBy(desc(schema.addresses.index))
      .limit(1)

    const start = last ? last.index + 1 : 0
    const end = Math.max(start, await readNextIndex(account.id)) + GAP_LIMIT

    // The node first: an address the app hands out must already be watched
    await watchAddresses(account.id, plan, start, end, account.startedAt)
    await db
      .insert(schema.addresses)
      .values(createAddressRows(account.id, plan, start, end))

    logger(`✅ ${toPrintable(account.label)}: addresses ${start} to ${end} are ready.`)
  } finally {
    rootKey.wipePrivateData()
  }
}
