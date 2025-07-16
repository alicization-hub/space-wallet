'use client'

import { Button, useDisclosure } from '@heroui/react'

import { SendIcon } from '@/components/icons'
import { ModalComponent } from '@/components/ui/modal'

import { FormComponent } from './form'

export function SendComponent({}: Readonly<{}>) {
  // __STATE's
  const m = useDisclosure()

  // __RENDER
  return (
    <>
      <Button
        className='hover:bg-foreground/5 hover:ring-foreground/10 h-10 gap-2 rounded-xs bg-transparent px-4 hover:ring-1'
        radius='none'
        type='button'
        aria-label='Button send'
        onPress={m.onOpen}>
        <SendIcon className='size-5' />
        <span className='text-sm font-semibold uppercase'>send</span>
      </Button>

      <ModalComponent control={m} size='xl'>
        <FormComponent onClose={m.onClose} />
      </ModalComponent>
    </>
  )
}
