"use server"

import { and, asc, eq, inArray } from "drizzle-orm"
import { pick } from "ramda"

import { db, schema } from "@/drizzle"
import { addressColumns, walletColumns } from "@/drizzle/table-columns"
import { derivationPathBuilder } from "@/libs/bitcoin/derivation"
import { RPCClient, RPCError } from "@/libs/bitcoin/rpc"
import { AddressBuilder, createRootKey } from "@/libs/bitcoin/scure"
import { createSignedTransaction } from "@/libs/bitcoin/transaction"
import { Cipher } from "@/libs/cipher"
import { logger } from "@/libs/logger"

import { withAccount } from "../account"
import { checkSend } from "../passphrase"
import { createValidator, type CreateValidator } from "./validator.zod"

/**
 * @param isUnknown - The transaction may have gone out, so the owner must check before trying again
 */
function failure(message: string, isUnknown: boolean = false) {
  return { success: false as const, message, isUnknown }
}

/**
 * Signs and broadcasts a transaction from an account.
 *
 * Expected failures are returned, not thrown, because Next.js hides thrown messages in production.
 *
 * @returns The transaction ID on success, otherwise why nothing was sent
 */
export const createTransaction = withAccount(
  async (account, formData: CreateValidator) => {
    const parsed = createValidator.safeParse(formData)
    if (!parsed.success) {
      return failure(parsed.error.issues[0].message)
    }

    const data = parsed.data

    const [wallet] = await db
      .select(pick(["slug", "bio", "passkey"], walletColumns))
      .from(schema.wallets)
      .where(eq(schema.wallets.id, account.walletId))

    // Verify the passphrase
    const check = await checkSend(account.walletId, wallet.passkey, data.passphrase)
    if (check.status === "locked") return failure(check.message)
    if (check.status !== "ok") return failure("Invalid passphrase.")

    // The change address, and the selected addresses as far as this account owns them
    const [addresses, change] = await db.transaction(async (tx) => {
      const addresses = await tx
        .select(pick(["address", "index", "type"], addressColumns))
        .from(schema.addresses)
        .where(
          and(
            eq(schema.addresses.accountId, account.id),
            inArray(
              schema.addresses.address,
              data.utxos.map((utxo) => utxo.address)
            )
          )
        )

      const [change] = await tx
        .select(pick(["address", "index"], addressColumns))
        .from(schema.addresses)
        .where(
          and(
            eq(schema.addresses.accountId, account.id),
            eq(schema.addresses.type, "change"),
            eq(schema.addresses.isUsed, false)
          )
        )
        .orderBy(asc(schema.addresses.index))
        .limit(1)

      return [addresses, change] as const
    })

    if (!change) {
      return failure(
        "No unused change address left. Run: bun tests/wallet.spec.ts addresses --wallet " +
          wallet.slug
      )
    }

    let rootKey: Awaited<ReturnType<typeof createRootKey>> | undefined

    try {
      // Get the RPC client instance
      const rpcClient = new RPCClient()
      await rpcClient.setWallet(account.id)

      // Every selected UTXO must still be unspent and on an address of this account. Skipping one
      // would quietly build a different transaction from the one the user confirmed.
      const utxos = await rpcClient.listUnspent()
      const inputs: Transaction.PrepareInput<"server">[] = []
      for (const selected of data.utxos) {
        const utxo = utxos.find(
          ({ txid, vout }) => txid === selected.txid && vout === selected.vout
        )
        const address = addresses.find(({ address }) => address === utxo?.address)

        if (!utxo) {
          return failure(`UTXO ${selected.txid}:${selected.vout} is no longer spendable.`)
        }

        if (!address) {
          return failure(
            `UTXO ${selected.txid}:${selected.vout} is on an address this wallet hasn't generated yet. Run: bun tests/wallet.spec.ts addresses --wallet ${wallet.slug}`
          )
        }

        const derivationPath = derivationPathBuilder()
          .purpose(account.purpose)
          .account(account.index)
          .change(address.type === "change" ? 1 : 0)
          .address(address.index)
          .build()

        inputs.push({
          ...pick(["txid", "vout", "address", "amount", "scriptPubKey"], utxo),
          type: account.purpose === 84 ? "wpkh" : "tr",
          derivationPath
        })
      }

      // Create the outputs, amount in BTC
      const outputs: Transaction.PrepareOutput[] = [
        {
          address: data.recipientAddress,
          amount: data.amount,
          isRecipient: true,
          isChange: false
        },
        {
          address: change.address,
          amount: 0,
          isRecipient: false,
          isChange: true
        }
      ]

      // Create the signed transaction
      const mnemonic = await Cipher.decrypt(wallet.bio, data.passphrase)
      rootKey = await createRootKey(mnemonic, data.passphrase)

      // The change address comes from the DB, so someone who can only write there could otherwise
      // redirect every send's change. Only the keys can say which address is really ours.
      const expectedChange = new AddressBuilder(rootKey).create(
        account.purpose,
        account.index,
        change.index,
        true
      )
      if (expectedChange !== change.address) {
        logger(
          `🚫 Change address ${change.index} of ${account.id} doesn't match the keys`
        )
        return failure(
          "The change address doesn't match this wallet's keys, so nothing was sent."
        )
      }

      const tx = await createSignedTransaction(rootKey, data.fee, inputs, outputs)

      // Test accepted by mempool and broadcast the transaction
      const [test] = await rpcClient.verifyTransaction(tx.hex)
      if (!test.allowed) {
        return failure(test["reject-reason"] ?? "The node rejected the transaction.")
      }

      try {
        await rpcClient.broadcastTransaction(tx.hex)
      } catch (error) {
        if (error instanceof RPCError) throw error

        // No answer doesn't mean no broadcast, and sending again from other coins could pay twice
        return failure(
          `The node didn't answer, so the transaction may have been broadcast. Check ${tx.id} before trying again.`,
          true
        )
      }

      return {
        success: true as const,
        message: "The transaction has been successfully broadcasted.",
        data: {
          txid: tx.id
        }
      }
    } catch (error) {
      // These come from the signing code and the node, never from the seed or the passphrase
      const message = error instanceof Error ? error.message : String(error)
      logger(`🚫 createTransaction failed: ${message}`)
      return failure(message)
    } finally {
      rootKey?.wipePrivateData()
    }
  }
)
