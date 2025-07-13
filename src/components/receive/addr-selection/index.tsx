'use client'

import { Button, DrawerBody, DrawerFooter, DrawerHeader, Pagination, Spinner } from '@heroui/react'
import { motion } from 'framer-motion'
import { useCallback, useState } from 'react'

import { FilterIcon } from '@/components/icons'
import { useEffectSync, useWallet } from '@/hooks'
import { findAddresses } from '@/libs/actions/address'
import { QueryValidator } from '@/libs/actions/address/validator'
import { Schema } from '@/libs/drizzle/types'

import { ItemComponent } from './item'

export function AddrComponent({
  onChange,
  onClose
}: Readonly<{
  onChange?: (addr: string) => void
  onClose?: () => void
}>) {
  // __STATE's
  const account = useWallet((state) => state.account)

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [state, setState] = useState<IPagination<Schema.iAddress>>()
  const [query, setQuery] = useState<QueryValidator>({
    page: 1,
    take: 8,
    type: 'receive'
  })

  // __FUNCTION's
  const handleFetch = useCallback(async () => {
    setIsLoading(true)

    try {
      const result = await findAddresses(query)
      setState(result)
    } catch (error) {
      console.error(error)
    }

    setIsLoading(false)
  }, [query])

  // __EFFECT's
  useEffectSync(handleFetch, 32, {
    deps: [handleFetch],
    bool: true
  })

  // __RENDER
  return (
    <>
      <DrawerHeader className='flex-col px-8 py-6 font-normal'>
        <div className='flex items-center gap-2'>
          <FilterIcon className='size-6' />
          <div className='text-lg font-medium capitalize'>address management</div>
        </div>

        <div className='text-foreground-500 text-xs'>
          Lorem, ipsum dolor sit amet consectetur adipisicing elit.
        </div>

        <hr className='border-foreground-50 mt-4' />
      </DrawerHeader>

      <DrawerBody className='relative flex flex-col gap-4 px-8 py-1'>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              transition: { duration: 0.2 }
            }}
            className='bg-background/75 absolute inset-0 z-10 flex items-start justify-center py-8'>
            <Spinner color='default' variant='dots' size='lg' />
          </motion.div>
        )}

        {state && state?.count > 0 ? (
          state.data.map((address) => (
            <ItemComponent
              key={address.id}
              type={account.purpose === 84 ? 'native segwit' : 'taproot'}
              address={address}
              onClick={() => {
                onChange?.(address.address)
                onClose?.()
              }}
            />
          ))
        ) : (
          <div className='text-foreground-300 font-number text-center text-lg font-light select-none'>
            No addresses found.
          </div>
        )}

        <Pagination
          classNames={{
            base: 'p-0 pt-4',
            wrapper: 'mx-auto',
            item: 'bg-foreground-50/25 size-10 cursor-pointer rounded-xs border-2 border-foreground-50/50',
            cursor: 'bg-foreground text-background rounded-xs font-bold'
          }}
          size='lg'
          variant='light'
          dotsJump={1}
          siblings={0}
          isDisabled={isLoading || !state?.count}
          total={state?.lastPage || 1}
          onChange={(page) => setQuery((prev) => ({ ...prev, page }))}
        />
      </DrawerBody>

      <DrawerFooter className='flex justify-between gap-4 px-8 py-6'>
        <Button
          className='bg-foreground/5 text-foreground-400 rounded-xs'
          type='button'
          aria-label='Button close'
          onPress={onClose}>
          <span className='text-sm capitalize'>close</span>
        </Button>
      </DrawerFooter>
    </>
  )
}
