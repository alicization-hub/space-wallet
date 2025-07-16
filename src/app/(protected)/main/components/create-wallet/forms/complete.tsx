'use client'

import { Button } from '@heroui/react'
import { motion } from 'framer-motion'
import { useCallback, useState } from 'react'

import { CircleCheckIcon, DangerIcon } from '@/components/icons'
import { switchAccount } from '@/libs/actions/account'
import { type SwitchValidator } from '@/libs/actions/account/validator'
import { toast } from '@/libs/utils'

export function ComplateComponent({ data }: Readonly<{ data: SwitchValidator }>) {
  // __STATE's
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // __FUNCTION's
  const handleAccess = useCallback(async () => {
    if (!data) return void 0
    setIsLoading(true)

    try {
      const result = await switchAccount(data)
      if (result) {
        location.assign(`/`)
      }
    } catch (error: any) {
      console.error('⚠️ An error occurred:', error)
      setIsLoading(false)
      toast({
        title: '⚠️ Wraning',
        description: error?.message || 'An error occurred.'
      })
    }
  }, [data])

  // __RENDER
  return (
    <motion.div
      className='text-center'
      key='3th-step'
      initial={{ opacity: 0.5, scale: 1.012 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}>
      <div className='flex flex-col justify-center'>
        <CircleCheckIcon className='mx-auto size-16 stroke-green-300' />
        <h3 className='text-xl leading-10 font-bold'>Wallet Created Successfully</h3>
        <p className='text-foreground-500 font-light'>
          Your wallet has been created and secured with your recovery phrase.
        </p>
      </div>

      <div className='my-6 flex items-center justify-center gap-4 rounded-xs bg-orange-400/5 p-4'>
        <DangerIcon className='size-6 stroke-orange-400' />
        <span className='font-light text-orange-400'>
          Keep your <b className='font-medium'>mnemonic seed phrase</b> safe and offline.
        </span>
      </div>

      <div className='flex justify-center gap-4'>
        <Button
          className='bg-foreground text-background rounded-xs'
          type='button'
          aria-label='Button access'
          isLoading={isLoading}
          onPress={handleAccess}>
          <span className='font-bold capitalize'>access wallet</span>
        </Button>
      </div>
    </motion.div>
  )
}
