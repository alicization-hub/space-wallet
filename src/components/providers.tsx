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
        placement='bottom-right'
        toastProps={{ timeout: 3_000 }}
        toastOffset={16}
        maxVisibleToasts={6}
      />
    </HeroUIProvider>
  )
}
