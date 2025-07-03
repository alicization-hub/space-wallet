'use client'

import { Button, useDisclosure } from '@heroui/react'

import { DangerIcon, DownloadIcon, FilterIcon, SendIcon } from '@/components/icons'
import { DialogComponent } from '@/components/ui/dialog'
import { ModalComponent } from '@/components/ui/modal'

import { AccountComponent } from './account'
import { ReceiveComponent } from './receive'

export function ButtonSend({}: Readonly<{}>) {
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

      <DialogComponent control={m} onClose={m.onClose}>
        <DangerIcon className='mx-auto size-12' />
        <p className='mt-2'>This feature is currently unavailable</p>
      </DialogComponent>
    </>
  )
}

export function ButtonReceive({}: Readonly<{}>) {
  // __STATE's
  const m = useDisclosure()

  // __RENDER
  return (
    <>
      <Button
        className='hover:bg-foreground/5 hover:ring-foreground/10 h-10 gap-2 rounded-xs bg-transparent px-4 hover:ring-1'
        radius='none'
        type='button'
        aria-label='Button receive'
        onPress={m.onOpen}>
        <DownloadIcon className='size-6' />
        <span className='text-sm font-semibold uppercase'>receive</span>
      </Button>

      <ModalComponent control={m} size='xl'>
        <ReceiveComponent onClose={m.onClose} />
      </ModalComponent>
    </>
  )
}

export function ButtonAccount({}: Readonly<{}>) {
  // __STATE's
  const m = useDisclosure()

  // __RENDER
  return (
    <>
      <Button
        className='hover:bg-foreground/5 hover:ring-foreground/10 h-10 gap-2 rounded-xs bg-transparent px-4 hover:ring-1'
        radius='none'
        type='button'
        aria-label='Button wallet'
        onPress={m.onOpen}>
        <FilterIcon className='size-6' />
        <span className='text-sm font-semibold uppercase'>account</span>
      </Button>

      <ModalComponent control={m} size='xl'>
        <AccountComponent onClose={m.onClose} />
      </ModalComponent>
    </>
  )
}
