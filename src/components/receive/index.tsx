"use client"

import { DownloadIcon } from "@keyline-icons/react"

import { Button } from "@/components/ui/button"
import { ModalComponent } from "@/components/ui/modal"
import { useOverlayState } from "@/hooks"

import { ReceiveForm } from "./form"

export function Receive({
  accountId,
  purpose
}: Readonly<{ accountId: string; purpose: Purpose }>) {
  const modal = useOverlayState()

  return (
    <>
      <Button
        className='hover:bg-space-50/5 hover:ring-space-50/10 h-10 gap-2 rounded-xs bg-transparent px-4 hover:ring-1'
        aria-label='Button receive'
        onClick={modal.open}>
        <DownloadIcon className='size-6' />
        <span className='text-sm font-semibold uppercase'>receive</span>
      </Button>

      <ModalComponent control={modal} label='Receive address' size='xl'>
        <ReceiveForm accountId={accountId} purpose={purpose} onClose={modal.close} />
      </ModalComponent>
    </>
  )
}
