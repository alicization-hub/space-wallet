'use client'

import { useMemo } from 'react'

import { useWallet } from '@/hooks'
import { satsToBitcoin } from '@/libs/bitcoin/unit'
import { numberToSpace } from '@/libs/utils'

export function BalanceComponent({}: Readonly<{}>) {
  // __STATE's
  const balance = useWallet((state) => state.balance)

  const total = useMemo(() => {
    const value = balance.total
    const [coin, decimal] = satsToBitcoin(value).toFixed(8).split('.')
    return `${coin}.${numberToSpace(decimal, 4).padStart(6, '0')}`
  }, [balance])

  const values = useMemo(
    () => [
      {
        label: 'confirmed',
        value: balance.confirmed
      },
      {
        label: 'unconfirmed',
        value: balance.unconfirmed
      },
      {
        label: 'immature',
        value: balance.immature
      },
      {
        label: 'spendable',
        value: balance.spendable
      }
    ],
    [balance]
  )

  // __RENDER
  return (
    <>
      <div className='flex justify-center gap-4'>
        {values.map((record, index) => (
          <div className='mirror flex items-center rounded-xs px-2' key={index}>
            <div className='text-space-200 text-xs font-light capitalize select-none'>{record.label}:</div>

            <div className='font-number ml-2'>
              <span className='font-semibold'>{satsToBitcoin(record.value).toFixed(8)}</span>
              <small className='text-space-400 pl-1 uppercase'>btc</small>
            </div>
          </div>
        ))}
      </div>

      <div className='flex flex-col gap-1 text-center'>
        <div className='font-number text-space-50 word-tighter text-6xl font-black'>{total}</div>

        <div className='font-number px-1'>
          <span className='text-space-200 word-tight text-xl'>
            {numberToSpace(values[3].value.toString())}
          </span>
          <span className='text-space-200 pl-1.5 text-sm font-light'>sats</span>
        </div>
      </div>
    </>
  )
}
