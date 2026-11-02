"use client"

import { SendIcon } from "@keyline-icons/react"

import { Button } from "@/components/ui/button"
import { ModalComponent } from "@/components/ui/modal"
import { useOverlayState } from "@/hooks"

/**
 * Follows `tests/transfers/run.ts`: change one, change the other.
 */
const STEPS = [
  {
    title: "Terminal password",
    text: "Unlocks the database and the node for this run."
  },
  {
    title: "Account",
    text: "Pick the wallet and account by number."
  },
  {
    title: "Pending sends",
    text: "Check any unconfirmed send first: sending again from other coins could pay twice."
  },
  {
    title: "Coins",
    text: "Pick them by number, such as 1,3."
  },
  {
    title: "Recipient",
    text: "Paste the address and compare all of it with where you got it."
  },
  {
    title: "Amount",
    text: "In BTC."
  },
  {
    title: "Fee rate",
    text: "Read the node's estimates and type a rate."
  },
  {
    title: "Passphrase",
    text: "Hidden as you type. The script signs and tests the transaction here, and nothing is sent yet."
  },
  {
    title: "Review",
    text: "Read what the signed transaction does: recipient, amount, fee, change, and coins."
  },
  {
    title: "Approve",
    text: "Type the last 8 characters of the recipient. Anything else stops without sending."
  },
  {
    title: "Result",
    text: "You get the transaction ID. If the node doesn't answer, the script says so and stops: search for the transaction ID on mempool.space or another block explorer, and run the script again to check before sending anything else."
  }
]

/**
 * Only explains how to send. The page has no way to start a send, so nothing it shows or holds can
 * change where money goes. There's no copy button either: a tampered page could put anything on the
 * clipboard.
 */
export function Send() {
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
        <div className='flex flex-col gap-4'>
          <div className='flex items-center gap-4 select-none'>
            <SendIcon className='size-7' />
            <div className='font-number text-xl font-medium capitalize'>send bitcoin</div>
          </div>

          <div className='border-y-space-50/5 flex flex-col gap-4 border-y-2 py-8'>
            <p className='text-space-300 text-sm'>
              Sending happens only in the terminal, so your passphrase never reaches the
              browser or the server. From the project folder, in PowerShell or Windows
              Terminal, type:
            </p>

            <code className='mirror font-number rounded-xs p-2 text-center'>
              bun tests/transfer.spec.ts
            </code>

            <p className='text-space-400 text-sm'>
              This command never changes: if this page ever shows another one, don&apos;t
              run it.
            </p>

            <ol className='flex list-inside list-decimal flex-col gap-2 text-sm'>
              {STEPS.map(({ title, text }) => (
                <li key={title}>
                  <b>{title}.</b> <span className='text-space-300'>{text}</span>
                </li>
              ))}
            </ol>

            <p className='text-space-400 text-sm'>
              This page shows the transaction after its next sync.
            </p>
          </div>

          <Button
            className='bg-space-50/5 text-space-400 rounded-xs'
            aria-label='Button close'
            onClick={modal.close}>
            <span className='text-sm capitalize'>close</span>
          </Button>
        </div>
      </ModalComponent>
    </>
  )
}
