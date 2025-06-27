'use client'

import { useDisclosure } from '@heroui/react'

import { DownloadIcon, SendIcon } from '@/components/icons'

function ButtonSend({}: Readonly<{}>) {
  // __STATE's
  const modal = useDisclosure()

  // __RENDER
  return (
    <button className='btn-light h-10 gap-2 rounded-xs px-4' type='button' aria-label='Receive'>
      <SendIcon className='size-5' />
      <span className='text-sm font-semibold uppercase'>send</span>
    </button>
  )
}

function ButtonReceive({}: Readonly<{}>) {
  // __STATE's
  const modal = useDisclosure()

  // __RENDER
  return (
    <button className='btn-light h-10 gap-2 rounded-xs px-4' type='button' aria-label='Receive'>
      <DownloadIcon className='size-6' />
      <span className='text-sm font-semibold uppercase'>receive</span>
    </button>
  )
}

export function ActionsComponent({}: Readonly<{}>) {
  // __RENDER
  return (
    <div className='flex items-center justify-center gap-4'>
      <ButtonSend />
      <ButtonReceive />
    </div>
  )
}
