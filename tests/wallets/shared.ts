import { randomUUID } from "crypto"

import { HDKey } from "@scure/bip32"
import { getUnixTime, hoursToMilliseconds } from "date-fns"
import { eq, inArray, or } from "drizzle-orm"
import { z } from "zod"

import { db, schema } from "@/drizzle"
import type { AddressInsertValues } from "@/drizzle/types"
import { GAP_LIMIT } from "@/libs/bitcoin/constants"
import { createDescriptors } from "@/libs/bitcoin/descriptor"
import { RPCClient } from "@/libs/bitcoin/rpc"
import { AddressBuilder } from "@/libs/bitcoin/scure"
import { logger } from "@/libs/logger"
import { slugify } from "@/libs/utils"
import { passphraseValidator } from "@/libs/validator.zod"

import { commandInput } from "../cmd.spec"

/**
 * A rescan can run for hours, and `importdescriptors` only answers when it has finished.
 */
const RESCAN_TIMEOUT = hoursToMilliseconds(12)

export const optionsValidator = z.object({
  "name": z.string().trim().min(1).max(64).optional(),
  "words": z.enum(["12", "24"]).default("24").transform(Number),
  "account": z.coerce.number().int().min(0).optional(),
  "started-at": z.iso
    .date()
    .transform((value) => new Date(value))
    .optional(),
  "wallet": z.string().optional()
})

export type OptionsValidator = z.infer<typeof optionsValidator>

/**
 * Everything needed to set up one account.
 */
export type AccountPlan = {
  purpose: Purpose
  index: number
  descriptors: { receive: string; change: string }
  createAddress: (index: number, isChange: boolean) => string
}

export function createSeedPlan(
  rootKey: HDKey,
  purpose: Purpose,
  index: number
): AccountPlan {
  const builder = new AddressBuilder(rootKey)

  return {
    purpose,
    index,
    descriptors: createDescriptors(rootKey, purpose, index),
    createAddress: (addressIndex, isChange) =>
      builder.create(purpose, index, addressIndex, isChange)
  }
}

/**
 * Asks for a new passphrase until it passes the strength rules and is typed the same way twice.
 */
export async function promptNewPassphrase() {
  while (true) {
    const passphrase = await commandInput("🔑 New passphrase")

    const parsed = passphraseValidator.safeParse(passphrase)
    if (!parsed.success) {
      logger(`🚫 ${parsed.error.issues[0].message}`)
      continue
    }

    const confirmation = await commandInput("🔑 Confirm passphrase")
    if (confirmation === passphrase) return passphrase

    logger("🚫 The passphrases do not match.")
  }
}

/**
 * Checks a wallet name and creates its slug.
 *
 * @throws When the name is missing, has no usable characters, or is taken
 */
export async function requireFreeName(name: string | undefined) {
  if (!name) throw new Error("--name is required.")

  const slug = slugify(name)
  if (!slug) throw new Error("--name needs at least one letter or number.")

  const [existing] = await db
    .select({ id: schema.wallets.id })
    .from(schema.wallets)
    .where(or(eq(schema.wallets.slug, slug), eq(schema.wallets.name, name)))
    .limit(1)

  if (existing) throw new Error(`A wallet named "${name}" (${slug}) already exists.`)

  return { name, slug }
}

/**
 * The address rows of an index range, for both chains.
 */
export function createAddressRows(
  accountId: string,
  plan: AccountPlan,
  start: number,
  end: number
) {
  const rows: AddressInsertValues[] = []

  for (let index = start; index <= end; index++) {
    rows.push(
      {
        accountId,
        label: `Receive No. ${index}`,
        type: "receive",
        index,
        address: plan.createAddress(index, false)
      },
      {
        accountId,
        label: `Change No. ${index}`,
        type: "change",
        index,
        address: plan.createAddress(index, true)
      }
    )
  }

  return rows
}

/**
 * Makes sure an account's Bitcoin Core wallet watches its addresses up to `end`, importing the
 * descriptors only where it doesn't yet.
 *
 * Bitcoin Core tops a descriptor's range up to its keypool size (1000 by default) when importing it,
 * and refuses a new range that doesn't include the current one. So a chain it already covers must be
 * left alone, and a range to import always starts at 0.
 *
 * @throws When the node refuses, or doesn't end up watching the addresses these keys derive, which
 * would hand out addresses whose funds never show up
 */
export async function watchAddresses(
  accountId: string,
  plan: AccountPlan,
  start: number,
  end: number,
  startedAt: Date
) {
  const rpcClient = new RPCClient()
  await rpcClient.setWallet(accountId)

  const { descriptors } = await rpcClient.listDescriptors()
  const requests: Descriptor.ImportRequest[] = []

  for (const internal of [false, true]) {
    const isCovered = descriptors.some(
      (descriptor) =>
        descriptor.active &&
        Boolean(descriptor.internal) === internal &&
        (descriptor.range?.[1] ?? -1) >= end
    )
    if (isCovered) continue

    const { descriptor } = await rpcClient.getDescriptor(
      internal ? plan.descriptors.change : plan.descriptors.receive
    )

    requests.push({
      desc: descriptor,
      active: true,
      range: [0, end],
      timestamp: getUnixTime(startedAt),
      internal,
      next_index: start
    })
  }

  if (requests.length > 0) {
    const results = await rpcClient.importDescriptors(requests, RESCAN_TIMEOUT)

    const failed = results.find((result) => !result.success)
    if (failed) {
      throw new Error(`Bitcoin Core refused the descriptors: ${failed.error?.message}`)
    }
  }

  for (const internal of [false, true]) {
    const { ismine } = await rpcClient.getAddressInfo(plan.createAddress(end, internal))
    if (!ismine) {
      throw new Error("Bitcoin Core doesn't watch the addresses these keys derive.")
    }
  }
}

/**
 * The first index past every address the node has seen used. A rescan moves it, and it can be past
 * the addresses in the DB, when the wallet was used somewhere else first.
 */
export async function readNextIndex(accountId: string) {
  const rpcClient = new RPCClient()
  await rpcClient.setWallet(accountId)

  const { descriptors } = await rpcClient.listDescriptors()

  return Math.max(
    0,
    ...descriptors.map(({ next_index, next }) => next_index ?? next ?? 0)
  )
}

/**
 * Sets up a wallet: first its Bitcoin Core wallets, then its rows. So a wallet in the DB is always
 * fully set up, and a failure leaves only an unused watch-only wallet on the node, which holds no
 * keys. Running the command again is safe.
 *
 * @param wallet - The new `wallets` row
 * @param plans - One per account
 * @param startedAt - Where the rescan starts. Addresses used earlier stay invisible.
 * @returns The IDs of the wallet and its accounts
 */
export async function provisionWallet(
  wallet: { name: string; slug: string; bio: string; passkey: string },
  plans: AccountPlan[],
  startedAt: Date
) {
  // Before the rescan, which can take hours: `addresses.address` is unique, so the insert at the
  // end would fail
  const [taken] = await db
    .select({ id: schema.addresses.id })
    .from(schema.addresses)
    .where(
      inArray(
        schema.addresses.address,
        plans.map((plan) => plan.createAddress(0, false))
      )
    )
    .limit(1)

  if (taken) throw new Error("These keys are already set up as another wallet.")

  const accounts: { id: string; plan: AccountPlan; end: number }[] = []

  for (const plan of plans) {
    logger(
      `🚀 Setting up the ${plan.purpose === 84 ? "SegWit" : "Taproot"} account on the node...`
    )

    const id = randomUUID()

    await new RPCClient().createWallet(id)
    await watchAddresses(id, plan, 0, GAP_LIMIT, startedAt)

    // A rescan can find addresses used past the first batch. They need rows too, or their coins
    // can't be spent from the app.
    const end = (await readNextIndex(id)) + GAP_LIMIT
    await watchAddresses(id, plan, 0, end, startedAt)

    accounts.push({ id, plan, end })
  }

  const walletId = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(schema.wallets)
      .values(wallet)
      .returning({ id: schema.wallets.id })

    await tx.insert(schema.accounts).values(
      accounts.map(({ id, plan }) => ({
        id,
        walletId: created.id,
        // `accounts.label` is unique across wallets
        label: `${wallet.slug} No. ${plan.purpose}-${plan.index}`,
        purpose: plan.purpose,
        index: plan.index,
        startedAt
      }))
    )

    await tx
      .insert(schema.addresses)
      .values(
        accounts.flatMap(({ id, plan, end }) => createAddressRows(id, plan, 0, end))
      )

    return created.id
  })

  return { walletId, accountIds: accounts.map(({ id }) => id) }
}

/**
 * Prints the result of a setup.
 */
export function reportWallet(slug: string, plans: AccountPlan[], startedAt: Date) {
  logger(`✅ Wallet "${slug}" is ready.`)

  for (const plan of plans) {
    logger(`📬 First ${plan.purpose} address: ${plan.createAddress(0, false)}`)
  }

  if (startedAt.getTime() > 0) {
    logger(
      `📝 Transactions before ${startedAt.toISOString().slice(0, 10)} were not scanned.`
    )
  }

  logger("🔓 Open it at /<account ID>. `bun tests/wallet.spec.ts list` shows the IDs.")
}
