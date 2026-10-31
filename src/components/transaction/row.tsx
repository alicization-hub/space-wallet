"use client"

import { FileTextIcon, LogInIcon, LogOutIcon, MessageIcon } from "@keyline-icons/react"
import { format } from "date-fns"
import { m } from "framer-motion"
import { useMemo } from "react"

import type { Transaction } from "@/actions/transaction/read"
import { Button } from "@/components/ui/button"
import { Snippet } from "@/components/ui/snippet"
import { Spinner } from "@/components/ui/spinner"
import { satsToBitcoin } from "@/libs/bitcoin/unit"
import { cls, numberToSpace, toExplorer, toShort } from "@/libs/utils"

import { TransactionAddress } from "./address"

export function TransactionRow({
  idx,
  tx,
  onClick
}: Readonly<{
  idx: number
  tx: Transaction
  onClick?: () => void
}>) {
  const amount = useMemo(() => {
    const [coin, decimal] = satsToBitcoin(tx.amount).toFixed(8).split(".")
    return `${coin}.${numberToSpace(decimal, 4).padStart(6, "0")}`
  }, [tx.amount])

  const icon = useMemo(() => {
    switch (tx.type) {
      case "send":
        return <LogOutIcon className='size-6' />

      case "receive":
        return <LogInIcon className='size-6' />

      default:
        return <MessageIcon className='size-6' />
    }
  }, [tx.type])

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        transition: { delay: idx / 6.4, duration: 0.4 }
      }}
      className='mirror grid items-center gap-8 rounded-xs p-4'
      style={{ gridTemplateColumns: "1.75rem repeat(2, 2fr) 1fr auto" }}>
      <div className='flex items-center'>
        {tx.status === "pending" ? <Spinner size='sm' /> : icon}
      </div>

      <div className='flex flex-col gap-1'>
        <Snippet codeString={tx.txid} symbol='#'>
          <a
            className='font-number cursor-pointer text-base font-bold tracking-wide hover:underline'
            href={toExplorer("tx", tx.txid)}
            target='_blank'
            rel='noopener noreferrer'>
            {toShort(tx.txid, 6, -8)}
          </a>
        </Snippet>

        <div className='text-space-400 text-xs'>
          {format(new Date(tx.timestamp), "PPpp")}
        </div>
      </div>

      <div className='flex flex-col'>
        <TransactionAddress key={0} label='from' type='input' values={tx.inputs} />
        <TransactionAddress key={1} label='to' type='output' values={tx.outputs} />
      </div>

      <div className='flex flex-col'>
        <div className='flex items-center gap-2' aria-label='Tx Amount'>
          <span
            className={cls("font-number word-tight text-base font-bold", {
              "text-green-300": tx.type === "receive",
              "text-rose-200": tx.type === "send"
            })}>
            {amount}
          </span>
          <span className='text-space-400 text-sm font-light uppercase'>btc</span>
        </div>

        <div className='flex items-center gap-2' aria-label='Tx Fee'>
          <span className='pr-1 text-sm font-light text-amber-500 capitalize'>fee</span>
          <span className='font-number word-tight text-sm text-amber-100'>
            {numberToSpace(tx.fee.toString())}
          </span>
          <span className='text-space-400 text-sm capitalize'>sats</span>
        </div>
      </div>

      <div className='flex'>
        <Button
          className='hover:bg-space-50/5 hover:ring-space-50/10 size-12 rounded-xs bg-transparent hover:ring-1'
          aria-label='Tx Detail'
          isIconOnly
          onClick={onClick}>
          <FileTextIcon className='size-6 opacity-80' />
        </Button>
      </div>
    </m.div>
  )
}
