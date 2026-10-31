import { notFound } from "next/navigation"
import { connection } from "next/server"

import { readAccount, readAccounts } from "@/actions/account/read"
import { readTransactions } from "@/actions/transaction/read"
import { LATEST_TRANSACTIONS } from "@/actions/transaction/validator.zod"
import { Transactions } from "@/components/transaction"
import { Wallet } from "@/components/wallet"
import { AccountSync } from "@/components/wallet/sync"
import { AccountTabs } from "@/components/wallet/tabs"

export const instant = false

export default async function Account({
  params
}: Readonly<{ params: Promise<{ uuid: string }> }>) {
  await connection()

  const { uuid } = await params
  const result = await readAccount(uuid)
  if (!result) notFound()

  const { wallet, ...account } = result
  const [accounts, transactions] = await Promise.all([
    readAccounts(wallet.id),
    readTransactions(account.id, LATEST_TRANSACTIONS)
  ])

  return (
    <div className='flex flex-col gap-4'>
      <AccountTabs accounts={accounts} currentId={account.id} />
      <Wallet account={account} />
      <Transactions transactions={transactions?.data ?? null} />
      <AccountSync accountId={account.id} />
    </div>
  )
}
