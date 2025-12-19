'use client'

import { secondsToMilliseconds } from 'date-fns'
import { useState } from 'react'

import { useEffectSync } from '@/hooks'
import { findTransactions, type Transaction } from '@/libs/actions/transaction'

import { EmptyComponent } from './empty'
import { ListComponent } from './list'

export function TransactionComponent() {
  // __STATE's
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [state, setState] = useState<IPagination<Transaction>>({
    data: [],
    count: 0,
    currentPage: 1,
    nextPage: null,
    prevPage: null,
    lastPage: 1
  })

  // __EFFECT's
  useEffectSync(
    async () => {
      try {
        const result = await findTransactions({ page: 1, take: 10 })
        setState(result)
        setIsLoading(false)
      } catch (error) {
        console.error(error)
      }
    },
    1e3,
    { interval: secondsToMilliseconds(10) }
  )

  // __RENDER
  return (
    <section className='px-8' aria-label='Transactions'>
      {isLoading ? (
        <div className='grid gap-4'>
          <div className='bg-space-50/5 ring-space-50/10 h-20 animate-pulse rounded-xs ring-1' />
          <div className='bg-space-50/5 ring-space-50/10 h-20 animate-pulse rounded-xs ring-1' />
        </div>
      ) : state.data.length > 0 ? (
        <div className='grid gap-4'>
          {state.data.map((tx, index) => (
            <ListComponent key={index} idx={index} tx={tx} />
          ))}
        </div>
      ) : (
        <EmptyComponent />
      )}
    </section>
  )
}
