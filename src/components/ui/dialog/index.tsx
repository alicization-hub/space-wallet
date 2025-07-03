'use client'

import { Button, Modal, ModalContent, useDisclosure } from '@heroui/react'

export function DialogComponent({
  control,
  children,
  ...rest
}: Readonly<{
  control: ReturnType<typeof useDisclosure>
  children: React.ReactNode
  onClose?: () => void
}>) {
  // __RENDER
  return (
    <Modal
      classNames={{ backdrop: 'backdrop-blur-sm' }}
      motionProps={{
        variants: {
          enter: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.1, ease: 'easeOut' }
          },
          exit: {
            y: -4,
            opacity: 0,
            transition: { duration: 0.1, ease: 'easeOut' }
          }
        }
      }}
      placement='top'
      size='sm'
      radius='none'
      scrollBehavior='normal'
      hideCloseButton
      isDismissable={false}
      isKeyboardDismissDisabled={true}
      isOpen={control.isOpen}
      onOpenChange={control.onOpenChange}>
      <ModalContent className='bg-background/90 ring-background/50 gap-8 rounded-xs px-8 py-6 shadow-none ring-2 backdrop-blur-2xl'>
        <div className='text-foreground text-center'>{children}</div>

        <Button
          className='bg-foreground text-background mx-auto h-8 rounded-sm'
          radius='none'
          variant='solid'
          onPress={rest?.onClose}>
          <span className='text-sm font-bold uppercase'>ok</span>
        </Button>
      </ModalContent>
    </Modal>
  )
}
