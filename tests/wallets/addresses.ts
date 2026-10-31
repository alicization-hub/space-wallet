import { and, desc, eq } from "drizzle-orm"

import { db, schema } from "@/drizzle"
import { GAP_LIMIT } from "@/libs/bitcoin/constants"
import { createRootKey } from "@/libs/bitcoin/scure"
import { Cipher } from "@/libs/cipher"
import { logger } from "@/libs/logger"
import { verifyPassword } from "@/libs/password"
import { passphraseInputValidator } from "@/libs/validator.zod"

import { commandInput } from "../cmd.spec"
import {
  createAddressRows,
  createSeedPlan,
  readNextIndex,
  watchAddresses,
  type OptionsValidator
} from "./shared"

/**
 * Generates the next batch of addresses for a wallet's accounts. Run it when the app says no unused
 * address is left.
 */
export async function extendAddresses(options: OptionsValidator) {
  if (!options.wallet) throw new Error("--wallet is required.")

  const [wallet] = await db
    .select()
    .from(schema.wallets)
    .where(eq(schema.wallets.slug, options.wallet))

  if (!wallet) throw new Error(`No wallet with the name "${options.wallet}".`)

  const passphrase = passphraseInputValidator.parse(await commandInput("🔑 Passphrase"))
  if (!(await verifyPassword(passphrase, wallet.passkey))) {
    throw new Error("Invalid passphrase.")
  }

  const mnemonic = await Cipher.decrypt(wallet.bio, passphrase)
  const rootKey = await createRootKey(mnemonic, passphrase)

  const accounts = await db
    .select()
    .from(schema.accounts)
    .where(
      and(
        eq(schema.accounts.walletId, wallet.id),
        options.account === undefined
          ? undefined
          : eq(schema.accounts.index, options.account)
      )
    )

  for (const account of accounts) {
    const plan = createSeedPlan(rootKey, account.purpose, account.index)

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

    logger(`✅ ${account.label}: addresses ${start} to ${end} are ready.`)
  }

  rootKey.wipePrivateData()
}
