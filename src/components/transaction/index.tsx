'use client'

import { useDisclosure } from '@heroui/react'
import { useCallback, useEffect, useState } from 'react'

import { ModalComponent } from '@/components/ui/modal'
import { findTransactions } from '@/libs/actions/transaction'
import { type Schema } from '@/libs/drizzle/types'

import { DetailComponent } from './detail'
import { EmptyComponent } from './empty'
import { ListComponent } from './list'

export function TransactionComponent() {
  // __STATE's
  const [txs, setTxs] = useState<Schema.iTransaction[]>([])
  const [isLoading, setLoading] = useState<boolean>(true)

  const [currentTx, setCurrentTx] = useState<Schema.iTransaction>()
  const m = useDisclosure()

  // __FUNCTION's
  const handleClick = useCallback((tx: Schema.iTransaction) => {
    setCurrentTx(tx)
    m.onOpen()
  }, [])

  const handleClose = useCallback(() => {
    setCurrentTx(undefined)
    m.onClose()
  }, [])

  // __EFFECT's
  useEffect(() => {
    async function func() {
      try {
        const result = await findTransactions({ page: 1, take: 10 })
        setTxs(result.data)
        setLoading(false)
        // setTimeout(() => func(), 1e4)
      } catch (error) {
        console.error(error)
      }
    }

    const timeoutId = setTimeout(() => func(), 1e3)
    return () => clearTimeout(timeoutId)
  }, [])

  // __RENDER
  return (
    <section className='px-8' aria-label='Transactions'>
      {isLoading ? (
        <div className='grid gap-4'>
          <div className='bg-foreground/5 ring-foreground/10 h-20 animate-pulse rounded-xs ring-1' />
          <div className='bg-foreground/5 ring-foreground/10 h-20 animate-pulse rounded-xs ring-1' />
        </div>
      ) : txs.length > 0 ? (
        <div className='grid gap-4'>
          {txs.map((tx, index) => (
            <ListComponent idx={index} tx={tx} key={tx.id} onClick={() => handleClick(tx)} />
          ))}
        </div>
      ) : (
        <EmptyComponent />
      )}

      <ModalComponent control={m} size='xl'>
        <DetailComponent tx={currentTx} onClose={handleClose} />
      </ModalComponent>
    </section>
  )
}
