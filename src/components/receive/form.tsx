'use client'

import { Button, Image, Snippet, useDisclosure } from '@heroui/react'
import qr from 'qrcode'
import { useCallback, useState } from 'react'

import { FilterIcon, ScanIcon } from '@/components/icons'
import { DrawerComponent } from '@/components/ui/drawer'
import { useEffectSync } from '@/hooks'
import { findAddress } from '@/libs/actions/address'

import { AddrComponent } from './addr-selection'

export function FormComponent({ onClose }: Readonly<{ onClose?: () => void }>) {
  // __STATE's
  const [isLoading, setLoading] = useState<boolean>(true)
  const [address, setAddress] = useState<string>('')
  const [qrcode, setQrcode] = useState<string>()

  const m = useDisclosure()

  // __FUNCTION's
  const handleChange = useCallback(async (addr: string) => {
    const dataUrl = await qr.toDataURL(addr, {
      type: 'image/webp',
      width: 250,
      margin: 2,
      scale: 1,
      color: {
        dark: '#0a0a0a',
        light: '#fafafa'
      },
      rendererOpts: {
        quality: 1
      }
    })

    setAddress(addr)
    setQrcode(dataUrl)
  }, [])

  // __EFFECT's
  useEffectSync(async () => {
    try {
      const result = await findAddress()
      await handleChange(result.address)
      setLoading(false)
    } catch (error) {
      console.error(error)
    }
  }, 256)

  // __RENDER
  return (
    <div className='flex flex-col gap-4'>
      <div className='flex items-center gap-4 select-none'>
        <ScanIcon className='size-7' />
        <div className='font-number text-xl font-medium capitalize'>receive address</div>
      </div>

      <div className='border-y-foreground/5 flex flex-col justify-center gap-4 border-y-2 py-8'>
        <Image
          classNames={{ wrapper: 'rounded-none mx-auto bg-foreground/5', img: 'rounded-xs' }}
          alt='QR Code address'
          src={qrcode}
          width={250}
          height={250}
        />

        {address ? (
          <Snippet
            classNames={{
              base: 'mirror w-full pl-6 rounded-xs bg-foreground/5 justify-center',
              pre: 'font-number select-none'
            }}
            symbol={false}
            codeString={address}>
            {address}
          </Snippet>
        ) : (
          <div className='bg-foreground/5 h-10 animate-pulse rounded-xs' />
        )}

        <div className='bg-foreground-100/25 text-foreground-500 rounded-xs p-4 text-center text-sm'>
          Upon at least one transaction confirmation, this address will be set to <b>used</b>
        </div>
      </div>

      <div className='flex justify-center gap-4'>
        <Button
          className='bg-foreground/5 text-foreground-400 rounded-xs'
          type='button'
          aria-label='Button close'
          isDisabled={isLoading}
          onPress={onClose}>
          {!isLoading && <span className='text-sm capitalize'>close</span>}
        </Button>

        <Button
          className='bg-foreground text-background rounded-xs'
          type='button'
          aria-label='Select address'
          isDisabled={isLoading}
          onPress={m.onOpen}>
          <FilterIcon className='stroke-background size-5' />
          <span className='font-bold capitalize'>addresses</span>
        </Button>
      </div>

      <DrawerComponent control={m} size='md'>
        <AddrComponent onChange={handleChange} onClose={m.onClose} />
      </DrawerComponent>
    </div>
  )
}
