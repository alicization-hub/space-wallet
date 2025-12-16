'use client'

import { Button } from '@heroui/react'

import { DocumentIcon } from '@/components/icons'
import { type Transaction } from '@/libs/actions/transaction'

export function DetailComponent({
  tx,
  onClose
}: Readonly<{
  tx?: Transaction
  onClose?: () => void
}>) {
  // __STATE's

  // __RENDER
  return (
    <div className='flex flex-col gap-4'>
      <div className='flex gap-4 select-none'>
        <DocumentIcon className='size-7' />
        <div className='font-number text-xl font-medium capitalize'>transaction detail</div>
      </div>

      <div className='border-y-foreground/5 flex flex-col justify-center gap-4 border-y-2 py-8'>...</div>

      <div className='flex justify-end gap-4'>
        <Button
          className='bg-foreground/5 text-foreground-400 rounded-xs'
          radius='none'
          size='sm'
          type='button'
          aria-label='Button close'
          onPress={onClose}>
          <span className='text-sm capitalize'>close</span>
        </Button>
      </div>
    </div>
  )
}
