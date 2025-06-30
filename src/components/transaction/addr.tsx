'use client'

import { Snippet } from '@heroui/react'

import { type Schema } from '@/libs/drizzle/types'
import { toExplorer, toShort } from '@/libs/utils'

export function AddrComponent({
  label,
  type,
  values
}: Readonly<{
  label: string
  type: 'input' | 'output'
  values: Schema.iTransaction['outputs'] | Schema.iTransaction['inputs']
}>) {
  // __STATE's
  const [{ address }] = values

  // __RENDER
  return (
    <div className='flex items-center gap-2'>
      <span className='text-foreground-500 text-sm capitalize'>{label}</span>
      {values.length === 1 ? (
        <Snippet
          classNames={{
            base: 'w-fit gap-2 bg-transparent p-0',
            symbol: 'text-foreground-500 font-number text-lg font-light',
            copyButton: 'size-5 min-w-fit text-sm opacity-75'
          }}
          codeString={address}
          hideSymbol
          disableTooltip>
          <a
            className='font-number cursor-pointer text-base font-bold tracking-wide hover:underline'
            href={toExplorer('addr', address)}
            target='_blank'
            rel='noopener noreferrer'>
            {toShort(address)}
          </a>
        </Snippet>
      ) : (
        <span className='font-number text-base font-bold capitalize'>{`${values.length} ${type}s`}</span>
      )}
    </div>
  )
}
