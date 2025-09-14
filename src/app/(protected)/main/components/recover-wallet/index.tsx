'use client'

import { Button, useDisclosure } from '@heroui/react'

import { UndoIcon } from '@/components/icons'
import { ModalComponent } from '@/components/ui/modal'

import { FormComponent } from './form'

export function RecoverWalletComponent({}: Readonly<{}>) {
  // __STATE's
  const m = useDisclosure()

  // __RENDER
  return (
    <>
      <Button
        className='ring-space-50/20 bg-space-50/5 flex h-auto flex-1 flex-col rounded-xs p-6 whitespace-normal ring-1 backdrop-blur-lg'
        type='button'
        aria-label='Button recover wallet'
        onPress={m.onOpen}>
        <UndoIcon className='size-8 rotate-180' />
        <div className='text-space-100 max-w-32 leading-6'>Recover a Wallet</div>
      </Button>

      <ModalComponent control={m} size='xl'>
        <FormComponent onClose={m.onClose} />
      </ModalComponent>
    </>
  )
}
