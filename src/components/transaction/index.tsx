import { findTransactions } from '@/libs/actions/transaction'

export async function TransactionComponent() {
  // __STATE's
  const txs = await findTransactions({ page: 1, take: 25 })
  console.log(txs)

  // __RENDER
  return (
    <section className='px-8' aria-label='Transactions'>
      <div className='grid gap-4'>
        <div className='bg-foreground/5 ring-foreground/10 h-12 animate-pulse rounded-xs ring-1' />
        <div className='bg-foreground/5 ring-foreground/10 h-12 animate-pulse rounded-xs ring-1' />
        <div className='bg-foreground/5 ring-foreground/10 h-12 animate-pulse rounded-xs ring-1' />
        <div className='bg-foreground/5 ring-foreground/10 h-12 animate-pulse rounded-xs ring-1' />
      </div>
    </section>
  )
}
