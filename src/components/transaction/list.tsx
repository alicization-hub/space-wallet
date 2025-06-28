'use client'

import { Button, Snippet, Spinner } from '@heroui/react'
import { format } from 'date-fns'
import { useMemo } from 'react'

import { ChatIcon, DocumentIcon, LoginIcon, LogoutIcon } from '@/components/icons'
import { satsToBitcoin } from '@/libs/bitcoin/unit'
import type { WebState } from '@/libs/drizzle/types'
import { numberToSpace, toExplorer, toShort } from '@/libs/utils'

import { AddrComponent } from './addr'

export function ListComponent({
  tx
}: Readonly<{
  tx: WebState.Transaction
}>) {
  // __STATE's
  const amount = useMemo(() => {
    const [coin, decimal] = satsToBitcoin(tx.amount).toFixed(8).split('.')
    return `${coin}.${numberToSpace(decimal, 4).padStart(6, '0')}`
  }, [tx.amount])

  const icon = useMemo(() => {
    switch (tx.type) {
      case 'send':
        return <LogoutIcon className='size-6' />

      case 'receive':
        return <LoginIcon className='size-6' />

      default:
        return <ChatIcon className='size-6' />
    }
  }, [tx.type])

  // __RENDER
  return (
    <div
      className='mirror grid items-center gap-8 rounded-xs p-4'
      style={{ gridTemplateColumns: 'auto repeat(2, 2fr) 1fr auto' }}>
      <div className='flex items-center'>
        {tx.status === 'pending' ? (
          <Spinner
            classNames={{ wrapper: 'size-auto translate-none gap-1' }}
            variant='dots'
            color='default'
          />
        ) : (
          icon
        )}
      </div>

      <div className='flex flex-col gap-1'>
        <Snippet
          classNames={{
            base: 'w-fit gap-2 bg-transparent p-0',
            symbol: 'text-foreground-500 font-number text-lg font-light',
            pre: 'font-number text-base font-bold tracking-wide',
            copyButton: 'size-5 min-w-fit text-sm opacity-75'
          }}
          codeString={tx.txid}
          symbol='#'
          disableTooltip>
          <a
            className='cursor-pointer hover:underline'
            href={toExplorer('tx', tx.txid)}
            target='_blank'
            rel='noopener noreferrer'>
            {toShort(tx.txid)}
          </a>
        </Snippet>

        <div className='text-foreground-500 text-xs'>{format(new Date(tx.timestamp), 'PPpp')}</div>
      </div>

      <div className='flex flex-col'>
        <AddrComponent key={0} label='from' values={tx.inputs} />
        <AddrComponent key={1} label='to' values={tx.outputs} />
      </div>

      <div className='flex flex-col'>
        <div className='flex items-center gap-2'>
          <span className='font-number word-tight text-lg font-bold'>{amount}</span>
          <span className='text-foreground-500 font-light uppercase'>btc</span>
        </div>

        <div className='flex items-center gap-2'>
          <span className='pr-1 text-sm font-light text-red-400 capitalize'>fee</span>
          <span className='font-number word-tight font-bold'>{numberToSpace(tx.fee.toString())}</span>
          <span className='text-foreground-500 text-sm capitalize'>sats</span>
        </div>
      </div>

      <div className='flex'>
        <Button className='rounded-sm' variant='light' radius='none' isIconOnly>
          <DocumentIcon className='size-6 opacity-80' />
        </Button>
      </div>
    </div>
  )
}
