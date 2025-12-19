'use client'

import { useMemo } from 'react'

import { ReceiveComponent } from '@/components/receive'
import { SendComponent } from '@/components/send'
import { useEffectSync, useWallet } from '@/hooks'
import { satsToBitcoin } from '@/libs/bitcoin/unit'
import type { Schema } from '@/libs/drizzle/types'
import { numberToSpace } from '@/libs/utils'

export function WalletComponent({
  wallet,
  account,
  defaultBalance
}: Readonly<{
  wallet: Schema.IWallet
  account: Schema.IAccount
  defaultBalance: Schema.IBalance
}>) {
  // __STATE's
  const setWallet = useWallet((state) => state.setWallet)
  const setAccount = useWallet((state) => state.setAccount)
  const balance = useWallet((state) => state.balance)

  const [total, balances] = useMemo(() => {
    const totalBalance = balance.total || defaultBalance.total
    const [coin, decimal] = satsToBitcoin(totalBalance).toFixed(8).split('.')

    return [
      `${coin}.${numberToSpace(decimal, 4).padStart(6, '0')}`,
      [
        {
          label: 'confirmed',
          value: balance.confirmed || defaultBalance.confirmed
        },
        {
          label: 'unconfirmed',
          value: balance.unconfirmed || defaultBalance.unconfirmed
        },
        {
          label: 'immature',
          value: balance.immature || defaultBalance.immature
        },
        {
          label: 'spendable',
          value: balance.spendable || defaultBalance.spendable
        }
      ]
    ] as const
  }, [balance, defaultBalance])

  // __EFFECT's
  useEffectSync(async () => {
    setWallet(wallet)
    setAccount(account)
  }, 20)

  // __RENDER
  return (
    <section className='flex flex-col gap-4 px-8 py-16' aria-label='Wallet'>
      <div className='flex justify-center gap-4'>
        {balances.map((record, index) => (
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
            {numberToSpace(balances[3].value.toString())}
          </span>
          <span className='text-space-200 pl-1.5 text-sm font-light'>sats</span>
        </div>
      </div>

      <div className='flex items-center justify-center gap-4'>
        <SendComponent />
        <ReceiveComponent />
      </div>
    </section>
  )
}
