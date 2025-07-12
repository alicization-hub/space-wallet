'use client'

import { Button, useDisclosure } from '@heroui/react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { DrawerComponent } from '@/components/ui/drawer'

import { LabelComponent } from '../input-label'
import { ListComponent } from './list'

type UTXO = Transaction.PrepareInput<'client'>

export function UtxoComponent({
  error,
  onChange
}: Readonly<{
  error?: string
  onChange?: (utxos: UTXO[]) => void
}>) {
  // __STATE's
  const [state, setState] = useState<UTXO[]>([])

  const totalValue = useMemo(() => state.reduce((acc, { amount }) => acc + amount, 0), [state])
  const m = useDisclosure()

  // __FUNCTION's
  const handleSelected = useCallback((utxos: UTXO[]) => {
    setState(utxos)
    if (onChange) onChange(utxos)
  }, [])

  // __RENDER
  return (
    <div className='flex flex-col gap-2'>
      <LabelComponent title='Coin Control' description='Manually select UTXOs to spend' required />

      <div className='ring-foreground-50 flex items-start justify-between gap-4 rounded-xs p-4 ring-1'>
        {state.length > 0 ? (
          <div className='flex flex-col gap-2'>
            <div className=''>
              <span className='pr-1 text-sm'>{`${state.length} UTXOs selected`}</span>
              <span className='font-number text-foreground-700'>{`(${totalValue.toFixed(8)} BTC)`}</span>
            </div>

            <div className='flex flex-wrap gap-2 overflow-hidden'>
              {state.map((utxo) => (
                <span
                  className='bg-foreground/10 text-foreground-800 font-number rounded-2xl px-2 py-0.5 text-sm'
                  key={utxo.txid}>
                  {`${utxo.amount.toFixed(8)} BTC`}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className='flex flex-col gap-1'>
            <div className='text-foreground-600 text-sm'>Select UTXOs to Spend</div>
            <div className='text-foreground-300 font-number text-sm font-light select-none'>
              No UTXOs selected
            </div>
          </div>
        )}

        <Button
          className='ring-foreground-50 bg-foreground-50/25 rounded-xs ring-2'
          aria-label='Select UTXOs'
          type='button'
          size='sm'
          onPress={m.onOpen}>
          <span className='text-foreground-600 text-sm capitalize'>select UTXOs</span>
        </Button>
      </div>

      {error && <div className='-mt-1 text-xs text-red-500'>{error}</div>}

      <DrawerComponent control={m} size='md'>
        <ListComponent selected={state} onApply={handleSelected} onClose={m.onClose} />
      </DrawerComponent>
    </div>
  )
}
