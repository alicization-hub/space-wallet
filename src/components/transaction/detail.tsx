"use client"

import { FileTextIcon } from "@keyline-icons/react"

import type { Transaction } from "@/actions/transaction/read"
import { Button } from "@/components/ui/button"

export function TransactionDetail({
  tx,
  onClose
}: Readonly<{
  tx?: Transaction
  onClose?: () => void
}>) {
  return (
    <div className='flex flex-col gap-4'>
      <div className='flex gap-4 select-none'>
        <FileTextIcon className='size-7' />
        <div className='font-number text-xl font-medium capitalize'>
          transaction detail
        </div>
      </div>

      <div className='border-y-foreground/5 flex flex-col justify-center gap-4 border-y-2 py-8'>
        ...
      </div>

      <div className='flex justify-end gap-4'>
        <Button
          className='bg-foreground/5 text-foreground-400 rounded-xs'
          size='sm'
          aria-label='Button close'
          onClick={onClose}>
          <span className='text-sm capitalize'>close</span>
        </Button>
      </div>
    </div>
  )
}
