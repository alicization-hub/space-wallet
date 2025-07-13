'use client'

import { Button, DrawerBody, DrawerFooter, DrawerHeader, Spinner } from '@heroui/react'
import { useCallback, useMemo, useState } from 'react'

import { FilterIcon } from '@/components/icons'
import { useEffectSync } from '@/hooks'
import { findUTXOs } from '@/libs/actions/transaction'

import { ItemComponent } from './item'

type UTXO = Transaction.PrepareInput<'client'>

export function ListComponent({
  selected = [],
  ...rest
}: Readonly<{
  selected: UTXO[]
  onApply?: (selected: UTXO[]) => void
  onClose?: () => void
}>) {
  // __STATE's
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const [state, setState] = useState<UTXO[]>([])
  const [currentSelected, setCurrentSelected] = useState<UTXO[]>(selected)

  const totalValue = useMemo(
    () => currentSelected.reduce((acc, { amount }) => acc + amount, 0),
    [currentSelected]
  )

  // __FUNCTION's
  const handleApply = useCallback(() => {
    if (rest?.onApply) rest.onApply(currentSelected)
    if (rest?.onClose) rest.onClose()
  }, [currentSelected, rest])

  const handleClick = useCallback(
    (utxo: UTXO) => {
      if (currentSelected.some((item) => item.txid === utxo.txid)) {
        setCurrentSelected((prev) => prev.filter((item) => item.txid !== utxo.txid))
      } else {
        setCurrentSelected((prev) => [...prev, utxo])
      }
    },
    [currentSelected]
  )

  // __EFFECT's
  useEffectSync(async () => {
    try {
      const result = await findUTXOs()
      setState(result)
      setIsLoading(false)
    } catch (error) {
      console.error(error)
    }
  }, 64)

  // __RENDER
  return (
    <>
      <DrawerHeader className='flex-col px-8 py-6 font-normal'>
        <div className='flex items-center gap-2'>
          <FilterIcon className='size-6' />
          <div className='text-lg font-medium'>Coin Control - Select UTXOs</div>
        </div>

        <div className='text-foreground-500 text-xs'>
          Manually select which unspent outputs to use for this transaction
        </div>

        <hr className='border-foreground-50 mt-4' />
      </DrawerHeader>

      <DrawerBody className='flex flex-col gap-4 px-8 py-1'>
        {isLoading ? (
          <div className='flex items-center justify-center'>
            <Spinner color='default' variant='dots' size='lg' />
          </div>
        ) : state.length > 0 ? (
          state.map((utxo) => {
            const isActive = currentSelected.some((r) => r.txid === utxo.txid)
            return (
              <ItemComponent
                key={utxo.txid}
                utxo={utxo}
                isActive={isActive}
                onClick={() => handleClick(utxo)}
              />
            )
          })
        ) : (
          <div className='text-foreground-300 font-number text-center text-lg font-light select-none'>
            No UTXO's found.
          </div>
        )}

        <div className='h-svh' />
      </DrawerBody>

      <DrawerFooter className='flex flex-col gap-4 px-8 py-6'>
        <div className='bg-foreground-50/50 grid grid-cols-2 gap-4 rounded-xs p-4'>
          <div className=''>
            <div className='text-foreground-400 text-sm'>Selected UTXOs</div>
            <div className='font-number font-medium'>{currentSelected.length}</div>
          </div>

          <div className=''>
            <div className='text-foreground-400 text-sm'>Total Value</div>
            <div className='font-number font-medium'>{totalValue.toFixed(8)} BTC</div>
          </div>
        </div>

        <div className='flex gap-4'>
          <Button
            className='bg-foreground/5 text-foreground-400 rounded-xs'
            type='button'
            aria-label='Button close'
            onPress={rest?.onClose}>
            <span className='text-sm capitalize'>close</span>
          </Button>

          <Button
            className='bg-foreground text-background grow rounded-xs'
            type='button'
            aria-label='Button submit'
            isDisabled={!currentSelected.length}
            onPress={handleApply}>
            <span className='font-bold capitalize'>use selected UTXOs</span>
          </Button>
        </div>
      </DrawerFooter>
    </>
  )
}
