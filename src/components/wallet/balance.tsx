'use client'

import { omit } from 'ramda'
import { useEffect, useMemo } from 'react'

import { useWallet } from '@/hooks'
import { satsToBitcoin } from '@/libs/bitcoin/unit'
import { type Schema } from '@/libs/drizzle/types'
import { numberToSpace } from '@/libs/utils'

type Data = Schema.iWallet & {
  account: Schema.iAccount
}

export function BalanceComponent({ data }: Readonly<{ data: Data }>) {
  // __STATE's
  const setWallet = useWallet((state) => state.setWallet)
  const setAccount = useWallet((state) => state.setAccount)
  const account = useWallet((state) => state.account)

  const total = useMemo(() => {
    const value = account.balance.total || data.account.balance.total
    const [coin, decimal] = satsToBitcoin(value).toFixed(8).split('.')
    return `${coin}.${numberToSpace(decimal, 4).padStart(6, '0')}`
  }, [account, data])

  const values = useMemo(
    () => [
      {
        label: 'confirmed',
        value: account.balance.confirmed || data.account.balance.confirmed
      },
      {
        label: 'unconfirmed',
        value: account.balance.unconfirmed || data.account.balance.unconfirmed
      },
      {
        label: 'immature',
        value: account.balance.immature || data.account.balance.immature
      },
      {
        label: 'spendable',
        value: account.balance.spendable || data.account.balance.spendable
      }
    ],
    [account, data]
  )

  // __EFFECT's
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setWallet(omit(['account'], data) as any)
      setAccount(data.account)
    }, 2e2)

    return () => clearTimeout(timeoutId)
  }, [data])

  // __RENDER
  return (
    <>
      <div className='flex justify-center gap-4'>
        {values.map((record, index) => (
          <div className='mirror flex items-center rounded-xs px-2' key={index}>
            <div className='text-foreground/90 text-xs font-light capitalize select-none'>
              {record.label}:
            </div>

            <div className='font-number ml-2'>
              <span className='font-semibold'>{satsToBitcoin(record.value).toFixed(8)}</span>
              <small className='text-foreground/70 pl-1 uppercase'>btc</small>
            </div>
          </div>
        ))}
      </div>

      <div className='flex flex-col gap-1 text-center'>
        <div className='font-number text-foreground word-tighter text-6xl font-black'>{total}</div>

        <div className='font-number px-1'>
          <span className='text-foreground/80 word-tight text-xl'>
            {numberToSpace(values[3].value.toString())}
          </span>
          <span className='text-foreground/70 pl-1.5 text-sm font-light'>sats</span>
        </div>
      </div>
    </>
  )
}
