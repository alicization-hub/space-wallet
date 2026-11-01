"use client"

import { FilterIcon, ScanIcon } from "@keyline-icons/react"
import { m } from "framer-motion"
import qr from "qrcode"
import { useCallback, useState, useTransition } from "react"

import { readAddress } from "@/actions/address/read"
import { Button } from "@/components/ui/button"
import { DrawerComponent } from "@/components/ui/drawer"
import { Snippet } from "@/components/ui/snippet"
import { toast } from "@/components/ui/toast"
import { useEffectSync, useOverlayState } from "@/hooks"

import { AddressSelection } from "./address-selection"

export function ReceiveForm({
  accountId,
  purpose,
  onClose
}: Readonly<{ accountId: string; purpose: Purpose; onClose?: () => void }>) {
  const [isPending, startTransition] = useTransition()
  const [address, setAddress] = useState<string>("")
  const [qrcode, setQrcode] = useState<string>()

  const drawer = useOverlayState()

  const handleChange = useCallback(async (addr: string) => {
    const dataUrl = await qr.toDataURL(addr, {
      type: "image/webp",
      width: 250,
      margin: 2,
      scale: 1,
      color: {
        dark: "#0a0a0a",
        light: "#fafafa"
      },
      rendererOpts: {
        quality: 1
      }
    })

    setAddress(addr)
    setQrcode(dataUrl)
  }, [])

  useEffectSync(() => {
    startTransition(async () => {
      const result = await readAddress(accountId)
      if (result.success) {
        await handleChange(result.data.address)
      } else {
        toast({
          title: "🚫 No address to show",
          description: result.message,
          timeout: 0
        })
      }
    })
  }, 256)

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex items-center gap-4 select-none'>
        <ScanIcon className='size-7' />
        <div className='font-number text-xl font-medium capitalize'>receive address</div>
      </div>

      <div className='border-y-space-50/5 flex flex-col justify-center gap-4 border-y-2 py-8'>
        <div className='bg-space-50/5 mx-auto size-62.5 rounded-xs'>
          {qrcode && (
            <m.img
              className='rounded-xs'
              alt='QR Code address'
              src={qrcode}
              width={250}
              height={250}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </div>

        {address ? (
          <Snippet
            className='mirror font-number w-full justify-center rounded-xs p-2'
            codeString={address}>
            {address}
          </Snippet>
        ) : (
          <div className='bg-space-50/5 h-10 animate-pulse rounded-xs' />
        )}

        <div className='bg-space-400/5 text-space-300 rounded-xs p-4 text-center text-sm'>
          Upon at least one transaction confirmation, this address will be set to{" "}
          <b>used</b>
        </div>
      </div>

      <div className='flex gap-4'>
        <Button
          className='bg-space-50/5 text-space-400 rounded-xs'
          aria-label='Button close'
          onClick={onClose}>
          <span className='text-sm capitalize'>close</span>
        </Button>

        <Button
          className='bg-space-50 text-background grow rounded-xs'
          aria-label='Select address'
          disabled={isPending}
          onClick={drawer.open}>
          <FilterIcon className='size-5' />
          <span className='font-bold capitalize'>addresses</span>
        </Button>
      </div>

      <DrawerComponent control={drawer} label='Address management' size='md'>
        <AddressSelection
          accountId={accountId}
          purpose={purpose}
          onChange={handleChange}
          onClose={drawer.close}
        />
      </DrawerComponent>
    </div>
  )
}
