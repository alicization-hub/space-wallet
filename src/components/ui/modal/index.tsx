'use client'

import { Button, Modal, ModalContent, useDisclosure } from '@heroui/react'

export function ModalComponent({
  control,
  children,
  size = 'lg'
}: Readonly<{
  control: ReturnType<typeof useDisclosure>
  children: React.ReactNode
  size?: 'md' | 'lg' | 'xl' | '2xl' | '3xl'
}>) {
  // __RENDER
  return (
    <Modal
      classNames={{
        backdrop: 'backdrop-blur-sm backdrop-saturate-50 bg-overlay/60'
      }}
      motionProps={{
        variants: {
          enter: {
            opacity: 1,
            transition: { duration: 0.1, ease: 'easeOut' }
          },
          exit: {
            opacity: 0,
            transition: { duration: 0.1, ease: 'easeOut' }
          }
        }
      }}
      placement='top'
      size={size}
      radius='none'
      scrollBehavior='normal'
      hideCloseButton
      isDismissable={false}
      isKeyboardDismissDisabled={true}
      isOpen={control.isOpen}
      onOpenChange={control.onOpenChange}>
      <ModalContent className='bg-background/80 ring-background/50 rounded-xs p-8 shadow-none ring-2 backdrop-blur-2xl'>
        {children}
      </ModalContent>
    </Modal>
  )
}
