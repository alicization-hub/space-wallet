'use client'

import { useDisclosure } from '@heroui/react'
import { useCallback, useState } from 'react'

import { ModalComponent } from '@/components/ui/modal'
import { useEffectSync } from '@/hooks'
import { findTransactions } from '@/libs/actions/transaction'
import { type Schema } from '@/libs/drizzle/types'

import { DetailComponent } from './detail'
import { EmptyComponent } from './empty'
import { ListComponent } from './list'

export function TransactionComponent() {
  // __STATE's
  const [txs, setTxs] = useState<Schema.iTransaction[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

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
  useEffectSync(
    async () => {
      try {
        const result = await findTransactions({ page: 1, take: 10 })
        setTxs(result.data)
        setIsLoading(false)
      } catch (error) {
        console.error(error)
      }
    },
    512,
    { interval: 10240 }
  )

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
