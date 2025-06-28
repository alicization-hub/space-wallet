'use client'

import { Snippet } from '@heroui/react'

import { WebState } from '@/libs/drizzle/types'
import { toExplorer, toShort } from '@/libs/utils'

export function AddrComponent({
  label,
  values
}: Readonly<{
  label: string
  values: WebState.Transaction['outputs'] | WebState.Transaction['inputs']
}>) {
  // __STATE's
  const [{ address }] = values

  // __RENDER
  return (
    <div className='flex items-center gap-2'>
      <span className='text-foreground-500 text-sm capitalize'>{label}</span>
      {values.length > 1 ? (
        <Snippet
          classNames={{
            base: 'w-fit gap-2 bg-transparent p-0',
            symbol: 'text-foreground-500 font-number text-lg font-light',
            pre: 'font-number text-base font-bold tracking-wide',
            copyButton: 'size-5 min-w-fit text-sm opacity-75'
          }}
          codeString={address}
          hideSymbol
          disableTooltip>
          <a
            className='cursor-pointer hover:underline'
            href={toExplorer('addr', address)}
            target='_blank'
            rel='noopener noreferrer'>
            {toShort(address)}
          </a>
        </Snippet>
      ) : (
        <span className='font-number text-base font-bold capitalize'>2 outputs</span>
      )}
    </div>
  )
}
