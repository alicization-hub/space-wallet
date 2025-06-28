'use client'

import { useDisclosure } from '@heroui/react'

import { DangerIcon, DownloadIcon, SendIcon } from '@/components/icons'
import { DialogComponent } from '@/components/ui/dialog'
import { ModalComponent } from '@/components/ui/modal'

import { ReceiveComponent } from './receive'

export function ButtonSend({}: Readonly<{}>) {
  // __STATE's
  const m = useDisclosure()

  // __RENDER
  return (
    <>
      <button
        className='btn-light h-10 gap-2 rounded-xs px-4'
        type='button'
        aria-label='Receive'
        onClick={m.onOpen}>
        <SendIcon className='size-5' />
        <span className='text-sm font-semibold uppercase'>send</span>
      </button>

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
      <button
        className='btn-light h-10 gap-2 rounded-xs px-4'
        type='button'
        aria-label='Receive'
        onClick={m.onOpen}>
        <DownloadIcon className='size-6' />
        <span className='text-sm font-semibold uppercase'>receive</span>
      </button>

      <ModalComponent control={m} size='xl'>
        <ReceiveComponent onClose={m.onClose} />
      </ModalComponent>
    </>
  )
}
