'use client'

import { Button, Spinner } from '@heroui/react'
import { useCallback, useEffect, useState } from 'react'

import { FilterIcon, WalletIcon } from '@/components/icons'
import { useWallet } from '@/hooks'
import { findWallets } from '@/libs/actions/wallet'
import { type Schema } from '@/libs/drizzle/types'

type State = Schema.iWallet & {
  accounts: Schema.iAccount[]
}

export function AccountComponent({ onClose }: Readonly<{ onClose?: () => void }>) {
  // __STATE's
  const currentWallet = useWallet((state) => state.wallet)
  const currentAccount = useWallet((state) => state.account)

  const [wallets, setWallets] = useState<State[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isDisabled, setIsDisabled] = useState<boolean>(true)

  // __FUNCTION's
  const handleClick = useCallback(() => {
    if (isDisabled) return void 0

    setIsLoading(true)
  }, [isDisabled])

  // __EFFECT's
  useEffect(() => {
    const func = async () => {
      const result = await findWallets()
      setWallets(result)
    }

    const timeoutId = setTimeout(() => func(), 100)
    return () => clearTimeout(timeoutId)
  }, [])

  // __RENDER
  return (
    <div className='flex flex-col gap-4'>
      <div className='flex items-center gap-4 select-none'>
        <FilterIcon className='size-6' />
        <div className='font-number text-xl font-medium capitalize'>account detail</div>
      </div>

      <div className='border-t-foreground/5 flex flex-col justify-center gap-4 border-t-2 py-8'>
        {wallets.length ? (
          <>
            <div className='bg-background mb-8 h-10'></div>

            <div className='flex justify-around gap-4'>
              {wallets.map((wallet) => (
                <div className='flex flex-col gap-2' key={wallet.id}>
                  <WalletIcon className='stroke-foreground/75 mx-auto size-8' />
                  <div className='font-number text-foreground-800 text-sm font-bold'>{wallet.name}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className='flex items-center justify-center py-8'>
            <Spinner color='default' size='lg' />
          </div>
        )}
      </div>

      <div className='flex justify-end gap-4'>
        <Button
          className='bg-foreground/5 text-foreground-400 rounded-xs'
          radius='none'
          size='sm'
          type='button'
          aria-label='Button close'
          onPress={onClose}>
          <span className='text-sm capitalize'>close</span>
        </Button>

        {/* <Button
          className='bg-foreground text-background rounded-xs px-4'
          radius='none'
          size='sm'
          type='button'
          aria-label='Button submit'
          isLoading={isLoading}
          isDisabled={isDisabled}
          onPress={handleClick}>
          <span className='text-sm font-bold capitalize'>confirm</span>
        </Button> */}
      </div>
    </div>
  )
}
