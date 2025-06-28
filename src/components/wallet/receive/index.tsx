'use client'

import { Button, Image, Snippet } from '@heroui/react'
import qr from 'qrcode'
import { useEffect, useState } from 'react'

import { ScanIcon } from '@/components/icons'
import { findAddress } from '@/libs/actions/address'

export function ReceiveComponent({ onClose }: Readonly<{ onClose?: () => void }>) {
  // __STATE's
  const [isLoading, setLoading] = useState<boolean>(true)
  const [address, setAddress] = useState<string>('')
  const [qrcode, setQrcode] = useState<string>()

  // __EFFECT's
  useEffect(() => {
    async function func() {
      try {
        const result = await findAddress()
        const dataUrl = await qr.toDataURL(result.address, {
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

        setAddress(result.address)
        setQrcode(dataUrl)
        setLoading(false)
      } catch (error) {
        console.error(error)
      }
    }

    const timeoutId = setTimeout(() => func())
    return () => clearTimeout(timeoutId)
  }, [])

  // __RENDER
  return (
    <div className='flex h-full flex-col gap-4'>
      <div className='flex gap-4 select-none'>
        <ScanIcon className='size-7' />
        <div className='font-number text-2xl capitalize'>receive address</div>
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
            radius='none'
            symbol={false}>
            {address}
          </Snippet>
        ) : (
          <div className='bg-foreground/5 h-10 animate-pulse rounded-xs' />
        )}

        <div className='rounded-xs bg-amber-900/10 p-4 text-center text-xs text-amber-600 ring-1 ring-amber-900/30'>
          Upon at least one transaction confirmation, this address will be set to <b>used</b>
        </div>
      </div>

      <div className='flex justify-center gap-4'>
        <Button
          className='bg-foreground text-background h-8 rounded-xs'
          radius='none'
          type='button'
          isLoading={isLoading}
          onPress={onClose}>
          {!isLoading && <span className='font-bold uppercase'>ok</span>}
        </Button>
      </div>
    </div>
  )
}
