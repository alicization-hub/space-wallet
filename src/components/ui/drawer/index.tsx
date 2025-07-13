'use client'

import { Drawer, DrawerContent, useDisclosure } from '@heroui/react'

export function DrawerComponent({
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
    <Drawer
      classNames={{
        backdrop: 'backdrop-blur-sm bg-overlay/60',
        base: 'inset-y-4 right-4'
      }}
      motionProps={{
        variants: {
          enter: {
            x: 0,
            opacity: 1,
            transition: { duration: 0.2, ease: 'easeOut' }
          },
          exit: {
            x: 4,
            opacity: 0,
            transition: { duration: 0.1, ease: 'easeOut' }
          }
        }
      }}
      size={size}
      radius='none'
      hideCloseButton
      shouldBlockScroll
      isDismissable={false}
      isKeyboardDismissDisabled={true}
      isOpen={control.isOpen}
      onOpenChange={control.onOpenChange}>
      <DrawerContent className='bg-background ring-foreground-300/10 rounded-xs shadow-none ring-4'>
        {children}
      </DrawerContent>
    </Drawer>
  )
}
