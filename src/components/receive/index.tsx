'use client'

import { Button, useDisclosure } from '@heroui/react'

import { DownloadIcon } from '@/components/icons'
import { ModalComponent } from '@/components/ui/modal'

import { FormComponent } from './form'

export function ReceiveComponent({}: Readonly<{}>) {
  // __STATE's
  const m = useDisclosure()

  // __RENDER
  return (
    <>
      <Button
        className='hover:bg-space-50/5 hover:ring-space-50/10 h-10 gap-2 rounded-xs bg-transparent px-4 hover:ring-1'
        radius='none'
        type='button'
        aria-label='Button receive'
        onPress={m.onOpen}>
        <DownloadIcon className='size-6' />
        <span className='text-sm font-semibold uppercase'>receive</span>
      </Button>

      <ModalComponent control={m} size='xl'>
        <FormComponent onClose={m.onClose} />
      </ModalComponent>
    </>
  )
}
