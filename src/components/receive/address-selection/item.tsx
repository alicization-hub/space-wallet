"use client"

import { QrCodeIcon } from "@keyline-icons/react"

import { Button } from "@/components/ui/button"
import { Chip } from "@/components/ui/chip"
import type { PublicAddress } from "@/drizzle/types"
import { toShort } from "@/libs/utils"

export function AddressItem({
  type,
  address,
  onClick
}: Readonly<{
  type: "native segwit" | "taproot"
  address: PublicAddress
  onClick?: () => void
}>) {
  return (
    <div className='border-b-space-50/5 flex justify-between gap-4 border-b-1 pb-4'>
      <div className='flex flex-col gap-1'>
        <div className='flex items-center gap-1'>
          <span className='text-space-400 font-number text-lg font-light'>@</span>
          <span className='font-number text-base font-bold tracking-wide'>
            {toShort(address.address, 4, -24)}
          </span>
        </div>

        <div className='flex flex-wrap gap-1'>
          <Chip className='opacity-75' color='success'>
            {type}
          </Chip>

          <Chip className='opacity-75' color='danger'>
            {address.index}
          </Chip>

          {address.isUsed && (
            <Chip className='opacity-80' color='secondary'>
              used
            </Chip>
          )}
        </div>
      </div>

      <Button
        className='ring-space-100/5 bg-space-700/5 rounded-xs ring-2'
        aria-label='Button select'
        isIconOnly
        disabled={address.isUsed}
        onClick={onClick}>
        <QrCodeIcon className='size-5' />
      </Button>
    </div>
  )
}
