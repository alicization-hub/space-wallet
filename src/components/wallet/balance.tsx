'use client'

import { useMemo } from 'react'

import { useWallet } from '@/hooks'
import { satsToBitcoin } from '@/libs/bitcoin/unit'
import { numberToSpace } from '@/libs/utils'

export function BalanceComponent({
  balance
}: Readonly<{
  balance: Wallet.Balance
}>) {
  // __STATE's
  const account = useWallet((state) => state.account)

  const total = useMemo(() => {
    const value = account.balance.total || balance.total
    const [coin, decimal] = satsToBitcoin(value).toString().split('.')
    return `${coin}.${numberToSpace(decimal, 4).padStart(6, '0')}`
  }, [account, balance])

  const values = useMemo(
    () => [
      {
        label: 'confirmed',
        value: account.balance.confirmed || balance.confirmed
      },
      {
        label: 'unconfirmed',
        value: account.balance.unconfirmed || balance.unconfirmed
      },
      {
        label: 'immature',
        value: account.balance.immature || balance.immature
      },
      {
        label: 'spendable',
        value: account.balance.spendable || balance.spendable
      }
    ],
    [account, balance]
  )

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
              <span className='font-semibold'>{satsToBitcoin(record.value)}</span>
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
