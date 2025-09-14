'use client'

import { Button, Modal, ModalContent, useDisclosure } from '@heroui/react'

export function DialogComponent({
  control,
  children,
  placement = 'top',
  ...rest
}: Readonly<{
  control: ReturnType<typeof useDisclosure>
  children: React.ReactNode
  placement?: 'auto' | 'top' | 'center'
  onClose?: () => void
}>) {
  // __RENDER
  return (
    <Modal
      classNames={{ backdrop: 'backdrop-blur-sm' }}
      motionProps={{
        variants: {
          enter: {
            y: 1,
            opacity: 1,
            transition: { duration: 0.1, ease: 'easeOut' }
          },
          exit: {
            y: -5,
            opacity: 0,
            transition: { duration: 0.1, ease: 'easeOut' }
          }
        }
      }}
      placement={placement}
      size='sm'
      radius='none'
      scrollBehavior='normal'
      hideCloseButton
      isDismissable={false}
      isKeyboardDismissDisabled={true}
      isOpen={control.isOpen}
      onOpenChange={control.onOpenChange}>
      <ModalContent className='bg-background ring-space-600/10 gap-6 rounded-xs p-8 shadow-none ring-4'>
        <div className='text-space-50 text-center'>{children}</div>

        <Button
          className='bg-space-50 text-background mx-auto max-w-28 rounded-xs'
          type='button'
          size='sm'
          onPress={rest?.onClose}>
          <span className='text-sm font-bold uppercase'>ok</span>
        </Button>
      </ModalContent>
    </Modal>
  )
}
