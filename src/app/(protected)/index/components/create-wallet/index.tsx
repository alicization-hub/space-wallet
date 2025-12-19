'use client'

import { Button, useDisclosure } from '@heroui/react'

import { WalletIcon } from '@/components/icons'
import { ModalComponent } from '@/components/ui/modal'

import { MainComponent } from './main'

export function CreateWalletComponent({}: Readonly<{}>) {
  // __STATE's
  const m = useDisclosure()

  // __RENDER
  return (
    <>
      <Button
        className='ring-space-50/20 bg-space-50/5 flex h-auto w-full flex-col gap-0 rounded-xs p-6 whitespace-normal ring-1 backdrop-blur-lg'
        type='button'
        aria-label='Button create new wallet'
        onPress={m.onOpen}>
        <WalletIcon className='size-12' />
        <div className='text-lg font-medium'>Create a new wallet</div>
      </Button>

      <ModalComponent control={m} size='xl'>
        <MainComponent onClose={m.onClose} />
      </ModalComponent>
    </>
  )
}
