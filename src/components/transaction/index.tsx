import type { Transaction } from "@/actions/transaction/read"

import { TransactionsEmpty } from "./empty"
import { TransactionRow } from "./row"

export function Transactions({
  transactions
}: Readonly<{ transactions: Transaction[] | null }>) {
  return (
    <section
      className='scrollbar-hide max-h-[60svh] overflow-x-hidden overflow-y-auto px-8 py-1'
      aria-label='Transactions'>
      {transactions === null ? (
        <div className='text-space-500 font-number py-20 text-center text-lg font-light select-none'>
          The node didn't answer, so the history can't be shown right now.
        </div>
      ) : transactions.length > 0 ? (
        <div className='grid gap-4'>
          {transactions.map((tx, index) => (
            <TransactionRow key={index} idx={index} tx={tx} />
          ))}
        </div>
      ) : (
        <TransactionsEmpty />
      )}
    </section>
  )
}
