'use client'

import { HeroUIProvider, ToastProvider } from '@heroui/react'
import dynamic from 'next/dynamic'

import { Locales } from '@/constants/enum'

import { SpaceComponent } from './space'

const DataObserver = dynamic(() => import('./observer'), { ssr: false })

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  // __RENDER
  return (
    <HeroUIProvider locale={Locales.UK}>
      <SpaceComponent />
      {children}

      <DataObserver />
      <ToastProvider
        placement='top-right'
        maxVisibleToasts={6}
        toastOffset={16}
        toastProps={{
          hideIcon: true,
          radius: 'none',
          timeout: 3_000,
          classNames: {
            base: 'max-w-[320px] p-4 rounded-xs'
          }
        }}
        cla
      />
    </HeroUIProvider>
  )
}
