'use client'

import { Button, useDisclosure } from '@heroui/react'

import { SmartphoneIcon } from '@/components/icons'
import { DialogComponent } from '@/components/ui/dialog'

export function ConnectHardwareComponent({}: Readonly<{}>) {
  // __STATE's
  const m = useDisclosure()

  // __RENDER
  return (
    <>
      <Button
        className='ring-space-50/20 bg-space-50/5 flex h-auto flex-1 flex-col rounded-xs p-6 whitespace-normal ring-1 backdrop-blur-lg'
        type='button'
        aria-label='Button connect hardware wallet'
        onPress={m.onOpen}>
        <SmartphoneIcon className='size-8' />
        <div className='text-space-100 max-w-32 leading-6'>Connect to Hardware Wallet</div>
      </Button>

      <DialogComponent control={m} onClose={m.onClose}>
        <div className='text-space-200'>This feature is not yet implemented.</div>
      </DialogComponent>
    </>
  )
}
