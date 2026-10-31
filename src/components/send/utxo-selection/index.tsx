"use client"

import { useCallback, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { DrawerComponent } from "@/components/ui/drawer"
import { InputLabel } from "@/components/ui/input-label"
import { useOverlayState } from "@/hooks"

import { UtxoList } from "./list"

type UTXO = Transaction.PrepareInput<"client">

export function UtxoSelection({
  error,
  onChange
}: Readonly<{
  error?: string
  onChange?: (utxos: UTXO[]) => void
}>) {
  const [state, setState] = useState<UTXO[]>([])

  const totalValue = useMemo(
    () => state.reduce((acc, { amount }) => acc + amount, 0),
    [state]
  )
  const drawer = useOverlayState()

  const handleSelected = useCallback(
    (utxos: UTXO[]) => {
      setState(utxos)
      if (onChange) onChange(utxos)
    },
    [onChange]
  )

  return (
    <div className='flex flex-col gap-2'>
      <InputLabel
        title='Coin Control'
        description='Manually select UTXOs to spend'
        isRequired
      />

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
                  key={`${utxo.txid}:${utxo.vout}`}>
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
          size='sm'
          onClick={drawer.open}>
          <span className='text-foreground-600 text-sm capitalize'>select UTXOs</span>
        </Button>
      </div>

      {error && <div className='-mt-1 text-xs text-red-500'>{error}</div>}

      <DrawerComponent control={drawer} label='Coin control' size='md'>
        <UtxoList selected={state} onApply={handleSelected} onClose={drawer.close} />
      </DrawerComponent>
    </div>
  )
}
