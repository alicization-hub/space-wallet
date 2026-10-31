"use client"

import { Snippet } from "@/components/ui/snippet"
import { toExplorer, toShort } from "@/libs/utils"

export function TransactionAddress({
  label,
  type,
  values
}: Readonly<{
  label: string
  type: "input" | "output"
  values: Transaction.Schema["outputs"] | Transaction.Schema["inputs"]
}>) {
  if (values.length === 0) return null

  const [{ address }] = values

  return (
    <div className='flex items-center gap-2'>
      <span className='text-space-400 text-sm capitalize'>{label}</span>
      {values.length === 1 ? (
        <Snippet codeString={address}>
          <a
            className='font-number cursor-pointer text-base font-bold tracking-wide hover:underline'
            href={toExplorer("addr", address)}
            target='_blank'
            rel='noopener noreferrer'>
            {toShort(address)}
          </a>
        </Snippet>
      ) : (
        <span className='font-number text-base font-bold capitalize'>{`${values.length} ${type}s`}</span>
      )}
    </div>
  )
}
