'use client'

import { Button, Popover, PopoverContent, PopoverTrigger, Spinner, useDisclosure } from '@heroui/react'
import { omit } from 'ramda'
import { useCallback, useState } from 'react'

import { WalletIcon } from '@/components/icons'
import { ModalComponent } from '@/components/ui/modal'
import { useEffectSync, useWallet } from '@/hooks'
import { findWallets } from '@/libs/actions/wallet'
import { satsToBitcoin } from '@/libs/bitcoin/unit'
import { type Schema } from '@/libs/drizzle/types'
import { cls } from '@/libs/utils'

import { ConfirmComponent } from './confirm'

type State = Schema.iWallet & {
  accounts: Schema.iAccount[]
}

export function AccountComponent({}: Readonly<{}>) {
  // __STATE's
  const currentAccount = useWallet((state) => state.account)

  const [currentState, setCurrentState] = useState<State>()
  const [wallets, setWallets] = useState<State[]>([])

  const [isOpen, setIsOpen] = useState<boolean>(false)
  const m = useDisclosure()

  // __FUNCTION's
  const handleClick = useCallback(
    (wallet: Schema.iWallet, account: Schema.iAccount) => {
      if (!wallet.isActive || !account.isActive || account.id === currentAccount.id) return void 0

      setCurrentState({ ...wallet, accounts: [account] })
      setIsOpen(false)
      setTimeout(() => m.onOpen(), 10)
    },
    [m, currentAccount]
  )

  // __EFFECT's
  useEffectSync(
    async () => {
      const result = await findWallets()
      setWallets(result)
    },
    256,
    { deps: [isOpen], bool: isOpen }
  )

  // __RENDER
  if (!currentAccount.id) return null
  return (
    <>
      <Popover
        placement='bottom'
        showArrow
        offset={8}
        triggerScaleOnOpen={false}
        motionProps={{
          variants: {
            enter: {
              y: 0,
              opacity: 1,
              transition: { duration: 0.2, ease: 'easeOut' }
            },
            exit: {
              y: -2,
              opacity: 0,
              transition: { duration: 0.1, ease: 'easeOut' }
            }
          }
        }}
        isOpen={isOpen}
        onOpenChange={setIsOpen}>
        <PopoverTrigger>
          <Button
            className='rounded-xl bg-transparent'
            type='button'
            size='sm'
            isIconOnly
            aria-label='Button wallet list'>
            <WalletIcon className='size-5' />
          </Button>
        </PopoverTrigger>

        <PopoverContent className='bg-background/80 rounded-xs p-0 backdrop-blur-2xl'>
          <div className='flex max-h-[50svh] w-64 flex-col gap-4 overflow-y-auto p-6'>
            {wallets.length ? (
              <div className='flex flex-col justify-around gap-8'>
                {wallets.map((wallet) => (
                  <div className='flex flex-col gap-2' key={wallet.id}>
                    <div className='flex items-center gap-2 select-none'>
                      <WalletIcon className='size-5' />
                      <div className='text-foreground-800 text-sm font-medium capitalize'>
                        {wallet.name} wallet
                      </div>
                    </div>

                    <div className='flex flex-col gap-0.5 p-1'>
                      {wallet.accounts.map((account) => (
                        <Button
                          key={account.id}
                          className={cls('bg-foreground/5 h-auto w-auto flex-col gap-0 rounded-xs py-2', {
                            'pointer-events-none': account.id === currentAccount.id
                          })}
                          type='button'
                          radius='none'
                          size='sm'
                          isDisabled={!account.isActive}
                          onPress={() => handleClick(wallet, account)}
                          aria-label='Button account info'>
                          {account.id === currentAccount.id && (
                            <div className='absolute inset-y-2 left-2 w-0.5 bg-green-300 shadow-sm shadow-green-500' />
                          )}
                          <div className='text-foreground-600 text-xs capitalize'>{account.label}</div>
                          <div className='font-number text-foreground-400 text-sm font-bold uppercase'>
                            {satsToBitcoin(account.balance.total).toFixed(8)} btc
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='flex items-center justify-center py-8'>
                <Spinner color='default' variant='dots' size='lg' />
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <ModalComponent control={m} size='md'>
        {currentState && (
          <ConfirmComponent
            wallet={omit(['accounts'], currentState)}
            account={currentState.accounts[0]}
            onClose={m.onClose}
          />
        )}
      </ModalComponent>
    </>
  )
}
