'use client'

import { DocumentIcon } from '@/components/icons'
import { type Schema } from '@/libs/drizzle/types'

export function DetailComponent({
  tx,
  onClose
}: Readonly<{
  tx?: Schema.iTransaction
  onClose?: () => void
}>) {
  // __STATE's

  // __RENDER
  return (
    <div className='flex flex-col gap-4'>
      <div className='flex gap-4 select-none'>
        <DocumentIcon className='size-7' />
        <div className='font-number text-2xl capitalize'>transaction detail</div>
      </div>

      <div className='border-y-foreground/5 flex flex-col justify-center gap-4 border-y-2 py-8'>...</div>
    </div>
  )
}
