'use client'

import { Button, Modal, ModalContent, useDisclosure } from '@heroui/react'

export function ModalComponent({
  control,
  children,
  placement = 'top',
  size = 'lg'
}: Readonly<{
  control: ReturnType<typeof useDisclosure>
  children: React.ReactNode
  placement?: 'auto' | 'top' | 'center'
  size?: 'md' | 'lg' | 'xl' | '2xl' | '3xl'
}>) {
  // __RENDER
  return (
    <Modal
      classNames={{
        backdrop: 'backdrop-blur-sm bg-overlay/60'
      }}
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
      placement={placement}
      size={size}
      radius='none'
      scrollBehavior='normal'
      hideCloseButton
      isDismissable={false}
      isKeyboardDismissDisabled={true}
      isOpen={control.isOpen}
      onOpenChange={control.onOpenChange}>
      <ModalContent className='bg-background ring-space-600/10 rounded-xs p-12 shadow-none ring-4'>
        {children}
      </ModalContent>
    </Modal>
  )
}
