"use server"

import { and, asc, count, eq, SQL } from "drizzle-orm"
import { omit } from "es-toolkit"

import { db, schema } from "@/drizzle"
import { addressColumns } from "@/drizzle/table-columns"
import { toPagination, withPagination } from "@/drizzle/utils"
import { READ_TIMEOUT } from "@/libs/bitcoin/constants"
import { RPCClient } from "@/libs/bitcoin/rpc"
import { logger } from "@/libs/logger"

import { withAccount } from "../account"
import { queryValidator, type QueryValidator } from "./validator.zod"

export type PublicAddress = Extract<
  Awaited<ReturnType<typeof readAddress>>,
  { success: true }
>["data"]

const UNCONFIRMED = "The node couldn't confirm the addresses of this account."

/**
 * Asks the node about addresses before the UI shows them for someone to pay. They come from the DB,
 * so without this, one edited row would send the next payment to someone else. The node knows them
 * from the descriptors, which come from the keys.
 *
 * @returns `false` when the node doesn't watch one of them, or doesn't answer
 */
async function isWatched(accountId: string, addresses: string[]) {
  try {
    const rpcClient = new RPCClient(READ_TIMEOUT)
    await rpcClient.setWallet(accountId)

    const infos = await rpcClient.batch<Descriptor.AddressInfo>(
      addresses.map((address) => ({ method: "getaddressinfo", params: [address] }))
    )

    if (infos.every(({ ismine }) => ismine)) return true

    logger(`🚫 The address book of ${accountId} doesn't match what the node watches`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger(`🚫 Checking the addresses of ${accountId} failed: ${message}`)
  }

  return false
}

export const readAddress = withAccount(async (account) => {
  const [address] = await db
    .select(omit(addressColumns, ["accountId"]))
    .from(schema.addresses)
    .where(
      and(
        eq(schema.addresses.accountId, account.id),
        eq(schema.addresses.type, "receive"),
        eq(schema.addresses.isUsed, false)
      )
    )
    .orderBy(asc(schema.addresses.index))
    .limit(1)

  if (!address) {
    return {
      success: false as const,
      message:
        "No unused address left. Generate more with: bun tests/wallet.spec.ts addresses"
    }
  }

  if (!(await isWatched(account.id, [address.address]))) {
    return { success: false as const, message: UNCONFIRMED }
  }

  return { success: true as const, data: address }
})

export const readAddresses = withAccount(async (account, input: QueryValidator) => {
  const query = queryValidator.parse(input)
  const filters: SQL[] = [eq(schema.addresses.accountId, account.id)]

  if (query?.status && query?.status !== "all") {
    filters.push(eq(schema.addresses.isUsed, query.status === "used"))
  }

  if (query?.type && query?.type !== "all") {
    filters.push(eq(schema.addresses.type, query.type))
  }

  const { total, results } = await db.transaction(async (tx) => {
    const queryBuilder = tx
      .select({
        ...omit(addressColumns, ["accountId"])
      })
      .from(schema.addresses)
      .where(and(...filters))
      .orderBy(asc(schema.addresses.isUsed), asc(schema.addresses.index))
      .$dynamic()

    const queryCountBuilder = tx
      .select({ count: count() })
      .from(schema.addresses)
      .where(and(...filters))
      .$dynamic()

    const results = await withPagination(queryBuilder, query.page, query.take).execute()
    const [r] = await queryCountBuilder.execute()

    return {
      total: +r.count,
      results
    }
  })

  const isConfirmed = await isWatched(
    account.id,
    results.map(({ address }) => address)
  )
  if (!isConfirmed) return { success: false as const, message: UNCONFIRMED }

  return {
    success: true as const,
    data: toPagination(results, total, query.page, query.take)
  }
})
