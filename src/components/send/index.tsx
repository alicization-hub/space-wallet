"use client"

import { SendIcon } from "@keyline-icons/react"

import { Button } from "@/components/ui/button"
import { ModalComponent } from "@/components/ui/modal"
import { useOverlayState } from "@/hooks"

import { SendForm } from "./form"

export function Send({
  accountId,
  purpose,
  spendable
}: Readonly<{ accountId: string; purpose: Purpose; spendable: number }>) {
  const modal = useOverlayState()

  return (
    <>
      <Button
        className='hover:bg-space-50/5 hover:ring-space-50/10 h-10 gap-2 rounded-xs bg-transparent px-4 hover:ring-1'
        aria-label='Button send'
        onClick={modal.open}>
        <SendIcon className='size-5' />
        <span className='text-sm font-semibold uppercase'>send</span>
      </Button>

      <ModalComponent control={modal} label='Send bitcoin' size='xl'>
        <SendForm
          accountId={accountId}
          purpose={purpose}
          spendable={spendable}
          onClose={modal.close}
        />
      </ModalComponent>
    </>
  )
}
