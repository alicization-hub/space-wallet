'use client'

import { TickIcon } from '@/components/icons'
import { cls, toExplorer, toShort } from '@/libs/utils'

type UTXO = Transaction.PrepareInput<'client'>

export function ItemComponent({
  utxo,
  isActive,
  onClick
}: Readonly<{
  utxo: UTXO
  isActive?: boolean
  onClick?: () => void
}>) {
  // __RENDER
  return (
    <div className='ring-foreground-50 hover:ring-foreground-100 flex items-center gap-4 rounded-xs p-2 ring-1'>
      <button
        className={cls('cursor-pointer p-2', isActive ? 'opacity-100' : 'opacity-20 hover:opacity-40')}
        type='button'
        onClick={onClick}>
        <TickIcon className='size-6' />
      </button>

      <div className='flex grow flex-col select-none'>
        <div className='flex items-center gap-6'>
          <div className='flex items-center gap-1'>
            <span className='text-foreground-500 font-number text-lg font-light'>#</span>
            <a
              className='font-number text-foreground-600 cursor-pointer text-base font-bold tracking-wide hover:underline'
              href={toExplorer('tx', utxo.txid)}
              target='_blank'
              rel='noopener noreferrer'>
              {toShort(utxo.txid, 4, -6)}
            </a>
          </div>

          <div className='flex items-center gap-1'>
            <span className='text-foreground-500 font-number text-lg font-light'>@</span>
            <a
              className='font-number text-foreground-600 cursor-pointer text-base font-bold tracking-wide hover:underline'
              href={toExplorer('addr', utxo.address)}
              target='_blank'
              rel='noopener noreferrer'>
              {toShort(utxo.address)}
            </a>
          </div>
        </div>

        <div className='flex items-center gap-4'>
          <span className='font-number text-lg font-bold'>{utxo.amount.toFixed(8)} BTC</span>

          <div className='flex flex-col items-center gap-2'>
            {!utxo.spendable && (
              <span className='rounded-xl bg-rose-900/20 px-2 py-0.5 text-xs text-rose-500 capitalize'>
                unspendable
              </span>
            )}
          </div>
        </div>

        <div className='text-foreground-400 text-sm'>{utxo.confirmations} confirmations</div>
      </div>
    </div>
  )
}
