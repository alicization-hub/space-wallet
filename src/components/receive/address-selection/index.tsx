"use client"

import { FilterIcon } from "@keyline-icons/react"
import { m } from "framer-motion"
import { useState, useTransition } from "react"

import { readAddresses, type PublicAddress } from "@/actions/address/read"
import type { QueryValidator } from "@/actions/address/validator.zod"
import { Button } from "@/components/ui/button"
import { DrawerBody, DrawerFooter, DrawerHeader } from "@/components/ui/drawer"
import { Pagination } from "@/components/ui/pagination"
import { Spinner } from "@/components/ui/spinner"
import { useEffectSync } from "@/hooks"

import { AddressItem } from "./item"

export function AddressSelection({
  accountId,
  purpose,
  onChange,
  onClose
}: Readonly<{
  accountId: string
  purpose: Purpose
  onChange?: (addr: string) => void
  onClose?: () => void
}>) {
  const [isPending, startTransition] = useTransition()
  const [state, setState] = useState<Pagination<PublicAddress>>()
  const [message, setMessage] = useState<string>()
  const [query, setQuery] = useState<QueryValidator>({
    page: 1,
    take: 8,
    type: "receive"
  })

  useEffectSync(
    () => {
      startTransition(async () => {
        const result = await readAddresses(accountId, query)
        if (result.success) {
          setState(result.data)
          setMessage(undefined)
        } else {
          setState(undefined)
          setMessage(result.message)
        }
      })
    },
    32,
    [accountId, query]
  )

  return (
    <>
      <DrawerHeader className='px-8 py-6 font-normal'>
        <div className='flex items-center gap-2'>
          <FilterIcon className='size-6' />
          <div className='text-lg font-medium capitalize'>address management</div>
        </div>

        <div className='text-space-400 text-xs'>
          Pick another unused address to receive on.
        </div>

        <hr className='border-space-50/5 mt-4' />
      </DrawerHeader>

      <DrawerBody className='relative gap-4 px-8 py-1'>
        {isPending && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              transition: { duration: 0.2 }
            }}
            className='bg-background/75 absolute inset-0 z-10 flex items-start justify-center py-8'>
            <Spinner size='lg' />
          </m.div>
        )}

        {message && (
          <div className='text-space-500 font-number text-center text-lg font-light select-none'>
            {message}
          </div>
        )}

        {state &&
          (state.count > 0 ? (
            state.data.map((address) => (
              <AddressItem
                key={address.id}
                type={purpose === 84 ? "native segwit" : "taproot"}
                address={address}
                onClick={() => {
                  onChange?.(address.address)
                  onClose?.()
                }}
              />
            ))
          ) : (
            <div className='text-space-500 font-number text-center text-lg font-light select-none'>
              No addresses found.
            </div>
          ))}

        {state && (
          <Pagination
            page={query.page}
            total={state.lastPage}
            isDisabled={isPending || !state.count}
            onChange={(page) => setQuery((prev) => ({ ...prev, page }))}
          />
        )}
      </DrawerBody>

      <DrawerFooter className='justify-between gap-4 px-8 py-6'>
        <Button
          className='bg-space-50/5 text-space-400 rounded-xs'
          aria-label='Button close'
          onClick={onClose}>
          <span className='text-sm capitalize'>close</span>
        </Button>
      </DrawerFooter>
    </>
  )
}
