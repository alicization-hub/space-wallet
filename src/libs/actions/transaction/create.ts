'use server'

import 'server-only'

import { and, asc, eq, inArray } from 'drizzle-orm'
import { find, pick } from 'ramda'

import { useAuth } from '@/libs/actions/auth'
import { derivationPathBuilder } from '@/libs/bitcoin/derivation'
import { RPCClient } from '@/libs/bitcoin/rpc'
import { createRootKey } from '@/libs/bitcoin/scure'
import { createSignedTransaction } from '@/libs/bitcoin/transaction'
import { cipher } from '@/libs/cipher'
import { accountColumns, addressColumns, db, schema } from '@/libs/drizzle'
import { password } from '@/libs/password'

import { createValidator, type CreateValidator } from './validator'

/**
 * Creates a new transaction using the provided data.
 *
 * @param formData - The transaction data.
 * @returns A response object with the success status and a message.
 */
export async function createTransaction(formData: CreateValidator) {
  try {
    const auth = await useAuth()
    const data = createValidator.parse(formData)

    // Verify the passphrase
    const [wallet] = await db.select().from(schema.wallets).where(eq(schema.wallets.id, auth.id))
    const isValid = await password.verify(wallet.passkey, data.passphrase)
    if (!isValid) {
      throw new Error('Invalid passphrase.')
    }

    // Get the RPC client instance
    const rpcClient = new RPCClient()
    await rpcClient.setWallet(auth.account.id)

    // Get the addresses and the change address
    const [addresses, changeAddress] = await db.transaction(async (tx) => {
      const addresses = await tx
        .select({
          ...pick(['address', 'index', 'type'], addressColumns),
          account: pick(['purpose', 'index'], accountColumns)
        })
        .from(schema.addresses)
        .innerJoin(schema.accounts, eq(schema.accounts.id, schema.addresses.accountId))
        .where(
          and(
            eq(schema.accounts.id, auth.account.id),
            eq(schema.addresses.isUsed, true),
            inArray(
              schema.addresses.address,
              data.utxos.map((utxo) => utxo.address)
            )
          )
        )

      const [{ address: changeAddress }] = await tx
        .select()
        .from(schema.addresses)
        .where(
          and(
            eq(schema.addresses.accountId, auth.account.id),
            eq(schema.addresses.type, 'change'),
            eq(schema.addresses.isUsed, false)
          )
        )
        .orderBy(asc(schema.addresses.index))
        .limit(1)

      return [addresses, changeAddress]
    })

    // Get the utxos and filter the selected ones
    const utxos = await rpcClient.listUnspent()
    const inputs: Transaction.PrepareInput<'server'>[] = []
    for (const u of data.utxos) {
      const utxo = find(({ txid, vout }) => txid === u.txid && vout === u.vout, utxos)
      const address = find(({ address }) => address === u.address, addresses)

      if (utxo && address) {
        const change = address.type === 'change' ? 1 : 0
        const derivationPath = derivationPathBuilder()
          .purpose(address.account.purpose)
          .account(address.account.index)
          .change(change)
          .address(address.index)
          .build()

        inputs.push({
          ...pick(['txid', 'vout', 'address', 'amount', 'scriptPubKey'], utxo),
          type: address.account.purpose === 84 ? 'wpkh' : 'tr',
          derivationPath
        })
      }
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
        address: changeAddress,
        amount: 0,
        isRecipient: false,
        isChange: true
      }
    ]

    // Create the signed transaction
    const mnemonic = await cipher.decrypt(wallet.bio, data.passphrase)
    const rootKey = await createRootKey(mnemonic, data.passphrase)
    const tx = await createSignedTransaction(rootKey, data.fee, inputs, outputs)

    // Test accepted by mempool and broadcast the transaction
    const [test] = await rpcClient.verifyTransaction(tx.hex)
    if (test.allowed) {
      await rpcClient.broadcastTransaction(tx.hex)

      return {
        success: true,
        message: 'The transaction has been successfully boradcasted.',
        data: {
          txid: tx.id,
          hex: tx.hex
        }
      }
    } else {
      throw new Error(test['reject-reason'])
    }
  } catch (error) {
    throw error
  }
}
