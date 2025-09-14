'use client'

import { Button, Chip } from '@heroui/react'

import { QrCodeIcon } from '@/components/icons'
import { Schema } from '@/libs/drizzle/types'
import { toShort } from '@/libs/utils'

export function ItemComponent({
  type,
  address,
  onClick
}: Readonly<{
  type: 'native segwit' | 'taproot'
  address: Schema.iAddress
  onClick?: () => void
}>) {
  // __RENDER
  return (
    <div className='border-b-space-50/5 flex justify-between gap-4 border-b-1 pb-4'>
      <div className='flex flex-col gap-1'>
        <div className='flex items-center gap-1'>
          <span className='text-space-400 font-number text-lg font-light'>@</span>
          <span className='font-number text-base font-bold tracking-wide'>
            {toShort(address.address, 4, -24)}
          </span>
        </div>

        <div className='flex flex-wrap gap-1'>
          <Chip className='text-xs capitalize opacity-75' size='sm' color='success' variant='flat'>
            {type}
          </Chip>

          <Chip className='text-xs capitalize opacity-75' size='sm' color='danger' variant='flat'>
            {address.index}
          </Chip>

          {address.isUsed && (
            <Chip className='text-xs capitalize opacity-80' size='sm' color='secondary' variant='flat'>
              used
            </Chip>
          )}
        </div>
      </div>

      <Button
        className='ring-space-100/5 bg-space-700/5 rounded-xs ring-2'
        aria-label='Button select'
        type='button'
        isIconOnly
        isDisabled={address.isUsed}
        onPress={onClick}>
        <QrCodeIcon className='size-5' />
      </Button>
    </div>
  )
}
