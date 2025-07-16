'use client'

import { Button, useDisclosure } from '@heroui/react'

import { DownloadIcon } from '@/components/icons'
import { DialogComponent } from '@/components/ui/dialog'

export function ImportWalletComponent({}: Readonly<{}>) {
  // __STATE's
  const m = useDisclosure()

  // __RENDER
  return (
    <>
      <Button
        className='ring-foreground/20 bg-foreground/5 flex h-auto flex-1 flex-col rounded-xs p-6 whitespace-normal ring-1 backdrop-blur-lg'
        type='button'
        aria-label='Button import wallet'
        onPress={m.onOpen}>
        <DownloadIcon className='size-8' />
        <div className='text-foreground-700 max-w-32 leading-6'>Import a Wallet</div>
      </Button>

      <DialogComponent control={m} onClose={m.onClose}>
        <div className='text-foreground-800'>This feature is not yet implemented.</div>
      </DialogComponent>
    </>
  )
}
