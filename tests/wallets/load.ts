import { and, eq } from "drizzle-orm"

import { db, schema } from "@/drizzle"
import { RPCClient } from "@/libs/bitcoin/rpc"
import { logger } from "@/libs/logger"

import { toPrintable } from "../cmd.spec"

/**
 * Loads the Bitcoin Core wallet of every active account, and keeps it loaded across restarts. The web
 * server's RPC user can only read, so it can't load a wallet the node left unloaded.
 */
export async function loadWallets() {
  const accounts = await db
    .select({ id: schema.accounts.id, label: schema.accounts.label })
    .from(schema.accounts)
    .innerJoin(schema.wallets, eq(schema.wallets.id, schema.accounts.walletId))
    .where(and(eq(schema.accounts.isActive, true), eq(schema.wallets.isActive, true)))

  const rpcClient = new RPCClient()

  for (const { id, label } of accounts) {
    await rpcClient.setWallet(id)
    logger(`✅ ${toPrintable(label)} is loaded.`)
  }
}
