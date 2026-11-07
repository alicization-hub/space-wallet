import { omit } from "es-toolkit"
import { notFound } from "next/navigation"
import { connection } from "next/server"

import { readAccount } from "@/actions/account/read"
import { readTransactions } from "@/actions/transaction/read"
import { LATEST_TRANSACTIONS } from "@/actions/transaction/validator.zod"
import { Transactions } from "@/components/transaction"
import { Wallet } from "@/components/wallet"
import { AccountSync } from "@/components/wallet/sync"

import { queryValidator } from "./validator.nuqs"

export const instant = false

/**
 * An account, opened as `/account?vid=<accounts.id>`. The navbar's menu links here.
 */
export default async function Account({ searchParams }: NextSearchParams) {
  await connection()

  const { vid } = await queryValidator.parse(searchParams)
  const result = await readAccount(vid)
  if (!result) notFound()

  const account = omit(result, ["wallet"])
  const transactions = await readTransactions(account.id, LATEST_TRANSACTIONS)

  return (
    <div className='flex flex-col gap-4'>
      <Wallet account={account} />
      <Transactions transactions={transactions?.data ?? null} />
      <AccountSync accountId={account.id} />
    </div>
  )
}
