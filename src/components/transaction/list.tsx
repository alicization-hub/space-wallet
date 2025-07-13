'use client'

import { Button, Snippet, Spinner } from '@heroui/react'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { useMemo } from 'react'

import { ChatIcon, DocumentIcon, LoginIcon, LogoutIcon } from '@/components/icons'
import { satsToBitcoin } from '@/libs/bitcoin/unit'
import { type Schema } from '@/libs/drizzle/types'
import { cls, numberToSpace, toExplorer, toShort } from '@/libs/utils'

import { AddrComponent } from './addr'

export function ListComponent({
  idx,
  tx,
  onClick
}: Readonly<{
  idx: number
  tx: Schema.iTransaction
  onClick?: () => void
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        transition: { delay: idx / 6.4, duration: 0.4 }
      }}
      className='mirror grid items-center gap-8 rounded-xs p-4'
      style={{ gridTemplateColumns: '1.75rem repeat(2, 2fr) 1fr auto' }}>
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
            copyButton: 'size-5 min-w-fit text-sm opacity-75'
          }}
          codeString={tx.txid}
          symbol='#'
          disableTooltip>
          <a
            className='font-number cursor-pointer text-base font-bold tracking-wide hover:underline'
            href={toExplorer('tx', tx.txid)}
            target='_blank'
            rel='noopener noreferrer'>
            {toShort(tx.txid, 6, -8)}
          </a>
        </Snippet>

        <div className='text-foreground-500 text-xs'>{format(new Date(tx.timestamp), 'PPpp')}</div>
      </div>

      <div className='flex flex-col'>
        <AddrComponent key={0} label='from' type='input' values={tx.inputs} />
        <AddrComponent key={1} label='to' type='output' values={tx.outputs} />
      </div>

      <div className='flex flex-col'>
        <div className='flex items-center gap-2' aria-label='Tx Amount'>
          <span
            className={cls('font-number word-tight text-base font-bold', {
              'text-green-300': tx.type === 'receive',
              'text-rose-200': tx.type === 'send'
            })}>
            {amount}
          </span>
          <span className='text-foreground-500 text-sm font-light uppercase'>btc</span>
        </div>

        <div className='flex items-center gap-2' aria-label='Tx Fee'>
          <span className='pr-1 text-sm font-light text-amber-500 capitalize'>fee</span>
          <span className='font-number word-tight text-sm text-amber-100'>
            {numberToSpace(tx.fee.toString())}
          </span>
          <span className='text-foreground-500 text-sm capitalize'>sats</span>
        </div>
      </div>

      <div className='flex'>
        <Button
          className='hover:bg-foreground/5 hover:ring-foreground/10 size-12 rounded-xs bg-transparent hover:ring-1'
          aria-label='Tx Detail'
          radius='none'
          isIconOnly
          onPress={onClick}>
          <DocumentIcon className='size-6 opacity-80' />
        </Button>
      </div>
    </motion.div>
  )
}
