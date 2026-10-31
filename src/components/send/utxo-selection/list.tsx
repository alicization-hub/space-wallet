"use client"

import { FilterIcon } from "@keyline-icons/react"
import { useParams } from "next/navigation"
import { useCallback, useMemo, useState, useTransition } from "react"

import { readUTXOs } from "@/actions/utxo/read"
import { Button } from "@/components/ui/button"
import { DrawerBody, DrawerFooter, DrawerHeader } from "@/components/ui/drawer"
import { Spinner } from "@/components/ui/spinner"
import { useEffectSync } from "@/hooks"

import { UtxoItem } from "./item"

type UTXO = Transaction.PrepareInput<"client">

/**
 * One transaction can pay this wallet several times, so a UTXO is identified by its transaction and
 * its output.
 */
function isSameUtxo(a: UTXO, b: UTXO) {
  return a.txid === b.txid && a.vout === b.vout
}

export function UtxoList({
  selected = [],
  ...rest
}: Readonly<{
  selected: UTXO[]
  onApply?: (selected: UTXO[]) => void
  onClose?: () => void
}>) {
  const { uuid } = useParams()
  const [, startTransition] = useTransition()

  const [state, setState] = useState<UTXO[]>()
  const [message, setMessage] = useState<string>()
  const [currentSelected, setCurrentSelected] = useState<UTXO[]>(selected)

  const totalValue = useMemo(
    () => currentSelected.reduce((acc, { amount }) => acc + amount, 0),
    [currentSelected]
  )

  const handleApply = useCallback(() => {
    if (rest?.onApply) rest.onApply(currentSelected)
    if (rest?.onClose) rest.onClose()
  }, [currentSelected, rest])

  const handleClick = useCallback((utxo: UTXO) => {
    setCurrentSelected((prev) =>
      prev.some((item) => isSameUtxo(item, utxo))
        ? prev.filter((item) => !isSameUtxo(item, utxo))
        : [...prev, utxo]
    )
  }, [])

  useEffectSync(
    () => {
      startTransition(async () => {
        const result = await readUTXOs(uuid as unknown as string)
        if (result.success) {
          setState(result.data)
        } else {
          setMessage(result.message)
        }
      })
    },
    64,
    [uuid]
  )

  return (
    <>
      <DrawerHeader className='px-8 py-6 font-normal'>
        <div className='flex items-center gap-2'>
          <FilterIcon className='size-6' />
          <div className='text-lg font-medium'>Coin Control - Select UTXOs</div>
        </div>

        <div className='text-foreground-500 text-xs'>
          Manually select which unspent outputs to use for this transaction
        </div>

        <hr className='border-foreground-50 mt-4' />
      </DrawerHeader>

      <DrawerBody className='gap-4 px-8 py-1'>
        {message ? (
          <div className='text-foreground-300 font-number text-center text-lg font-light select-none'>
            {message}
          </div>
        ) : !state ? (
          <div className='flex items-center justify-center py-8'>
            <Spinner size='lg' />
          </div>
        ) : state.length > 0 ? (
          state.map((utxo) => (
            <UtxoItem
              key={`${utxo.txid}:${utxo.vout}`}
              utxo={utxo}
              isActive={currentSelected.some((item) => isSameUtxo(item, utxo))}
              onClick={() => handleClick(utxo)}
            />
          ))
        ) : (
          <div className='text-foreground-300 font-number text-center text-lg font-light select-none'>
            No UTXO's found.
          </div>
        )}
      </DrawerBody>

      <DrawerFooter className='flex-col gap-4 px-8 py-6'>
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
            aria-label='Button close'
            onClick={rest?.onClose}>
            <span className='text-sm capitalize'>close</span>
          </Button>

          <Button
            className='bg-foreground text-background grow rounded-xs'
            aria-label='Button submit'
            disabled={!currentSelected.length}
            onClick={handleApply}>
            <span className='font-bold capitalize'>use selected UTXOs</span>
          </Button>
        </div>
      </DrawerFooter>
    </>
  )
}
