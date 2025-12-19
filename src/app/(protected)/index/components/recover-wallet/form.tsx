'use client'

import { Button } from '@heroui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'

import { UndoIcon } from '@/components/icons'
import { LabelComponent } from '@/components/ui/input-label'
import { createWallet } from '@/libs/actions/wallet'
import { createWalletValidator, type CreateWalletValidator } from '@/libs/actions/wallet/validator'
import { mnemonic } from '@/libs/bitcoin/mnemonic'
import { toast } from '@/libs/utils'

import { InputComponent } from './input'

export function FormComponent({
  onClose
}: Readonly<{
  onClose?: () => void
}>) {
  // __STATE's
  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors: error }
  } = useForm<CreateWalletValidator>({
    resolver: zodResolver(createWalletValidator)
  })

  const [isValid, setIsValid] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // __FUNCTION's
  const handleClick = useCallback((formData: CreateWalletValidator) => {
    const func = async (resolve: (value: any) => void) => {
      try {
        const result = await createWallet(formData)
        if (result.success) {
          resolve(true)
          toast({
            title: '✅ Success',
            description: 'Your wallet has been successfully recovered and encrypted.',
            timeout: 0
          })

          if (onClose) onClose()
        }
      } catch (error: any) {
        console.error('⚠️ An error occurred:', error)
        resolve(true)
        toast({
          timeout: 9e3,
          title: '⚠️ An error occurred',
          description: error?.message || 'Something went wrong while recovery the wallet. Please try again.'
        })
      }

      setIsLoading(false)
    }

    setIsLoading(true)
    toast({
      promise: new Promise((resolve) => func(resolve)),
      description: '🚀 Your wallet was in recovery and encrypting security.',
      hideCloseButton: true
    })
  }, [])

  // __RENDER
  return (
    <form className='flex flex-col gap-6' onSubmit={handleSubmit(handleClick)}>
      <div className='border-b-space-50/5 flex items-center gap-2 border-b-2 pb-4 select-none'>
        <UndoIcon className='size-6 rotate-180' />
        <div className='text-xl font-medium capitalize'>recovery wallet</div>
      </div>

      <div className='flex flex-col gap-2'>
        <LabelComponent
          title='recovery mnemonic seed phrase'
          description='Type to search, use ↑↓ to navigate, Enter/Space to select, Backspace to remove last.'
          required
        />

        <InputComponent
          defaultValues={getValues('mnemonic')}
          onChange={(value) => {
            setValue('mnemonic', value)
            if ([12, 24].includes(value.split(' ').length)) {
              setIsValid(mnemonic.validate(value))
            }
          }}
        />

        {error.mnemonic && <div className='text-xs text-red-500'>{error.mnemonic.message}</div>}
      </div>

      <div className='flex flex-col gap-2'>
        <LabelComponent
          title='wallet name'
          description='Lorem ipsum dolor sit amet consectetur adipisicing elit.'
          required
        />

        <input className='form-input h-12 px-4' {...register('name')} />

        {error.name && <div className='text-xs text-red-500'>{error.name.message}</div>}
      </div>

      {isValid && (
        <motion.div
          className='flex flex-col gap-6'
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}>
          <div className='flex flex-col gap-2'>
            <LabelComponent
              title='passphrase'
              description='Lorem ipsum dolor sit amet consectetur adipisicing elit.'
              required
            />

            <input
              className='form-input h-12 px-4 tracking-widest'
              type='password'
              {...register('passphrase')}
            />

            {error.passphrase && <div className='text-xs text-red-500'>{error.passphrase.message}</div>}
          </div>

          <div className='flex flex-col gap-2'>
            <LabelComponent
              title='confirm passphrase'
              description='Lorem ipsum dolor sit amet consectetur adipisicing elit.'
              required
            />

            <input
              className='form-input h-12 px-4 tracking-widest'
              type='password'
              {...register('confirmPassphrase')}
            />

            {error.confirmPassphrase && (
              <div className='text-xs text-red-500'>{error.confirmPassphrase.message}</div>
            )}
          </div>
        </motion.div>
      )}

      <div className='flex gap-4'>
        <Button
          className='bg-space-50/5 text-space-400 rounded-xs'
          type='button'
          aria-label='Button cancel'
          isDisabled={isLoading}
          onPress={onClose}>
          <span className='text-sm capitalize'>cancel</span>
        </Button>

        <Button
          className='bg-space-50 text-background grow rounded-xs'
          type='submit'
          aria-label='Button confirm'
          isLoading={isLoading}
          isDisabled={!isValid || isLoading}>
          <span className='font-bold capitalize'>confirm</span>
        </Button>
      </div>
    </form>
  )
}
