'use client'

import { Button } from '@heroui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { useCallback, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'

import { UndoIcon } from '@/components/icons'
import { LabelComponent } from '@/components/ui/input-label'
import { SwitchValidator } from '@/libs/actions/account/validator'
import { createWallet } from '@/libs/actions/wallet'
import { createWalletValidator, type CreateWalletValidator } from '@/libs/actions/wallet/validator'
import { shuffle, toast } from '@/libs/utils'

export function VerifyComponent({
  data,
  onClose,
  onSuccess
}: Readonly<{
  data: Pick<CreateWalletValidator, 'name' | 'mnemonic'>
  onClose?: () => void
  onSuccess?: (
    data: Omit<SwitchValidator, 'passphrase'> & Pick<CreateWalletValidator, 'name' | 'mnemonic'>
  ) => void
}>) {
  // __STATE's
  const {
    register,
    handleSubmit,
    formState: { errors: error }
  } = useForm<CreateWalletValidator>({
    resolver: zodResolver(createWalletValidator),
    defaultValues: data
  })

  const [selected, setSelected] = useState<string[]>([])
  const [isValid, setIsValid] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const [mnemonic, shuffled] = useMemo(() => {
    const mn = data.mnemonic.split(/\s+/)
    return [mn, shuffle(mn)]
  }, [data.mnemonic])

  // __FUNCTION's
  const handleCreate = useCallback((formData: CreateWalletValidator) => {
    const func = async (resolve: (value: any) => void) => {
      try {
        const result = await createWallet(formData)
        if (result.success) {
          resolve(true)
          if (onSuccess && result.data) {
            const { id: walletId } = result.data
            const { id: accountId } = result.data.accounts[0]
            onSuccess({ ...formData, walletId, accountId })
          }
        }
      } catch (error: any) {
        console.error('⚠️ An error occurred:', error)
        resolve(true)
        toast({
          timeout: 9e3,
          title: '⚠️ An error occurred',
          description: error?.message || 'Something went wrong while creating the wallet. Please try again.'
        })
      }

      setIsLoading(false)
    }

    setIsLoading(true)
    toast({
      promise: new Promise((resolve) => func(resolve)),
      description: '🚀 Your wallet was in creating and encrypting security.',
      hideCloseButton: true
    })
  }, [])

  const handleClick = useCallback(
    (word: string) => {
      const addSelected = [...selected, word]
      setSelected(addSelected)

      if (addSelected.length === mnemonic.length) {
        const valid = addSelected.every((word, index) => word === mnemonic[index])
        if (!valid) {
          setSelected([])
          toast({
            title: '⚠️ Incorrect sorting',
            description: 'Invalid mnemonic seed phrase. Please try again.'
          })
        }

        setIsValid(valid)
      }
    },
    [mnemonic, selected]
  )

  // __RENDER
  return (
    <motion.form
      className='flex flex-col gap-4'
      onSubmit={handleSubmit(handleCreate)}
      animate={{ opacity: 1, x: 0 }}
      initial={{ opacity: 0, x: 8 }}
      exit={{ opacity: 0, x: -4 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}>
      <div className='flex flex-col gap-2'>
        <div className='flex items-center justify-between gap-8'>
          <LabelComponent
            title='verify your recovery mnemonic seed phrase'
            description="Click the words in the correct order to verify you've saved them properly"
            required
          />

          <Button
            className='ring-foreground-50 bg-foreground-50/25 size-9 min-w-auto rounded-xs ring-2'
            type='button'
            aria-label='Button undo'
            title='Reset'
            isIconOnly
            isDisabled={isLoading}
            onPress={() => setSelected([])}>
            <UndoIcon className='size-5' />
          </Button>
        </div>

        <div className='ring-foreground-50 flex flex-col gap-4 rounded-xs p-4 ring-1'>
          <div className='flex flex-wrap justify-center gap-2 px-6'>
            {shuffled.map((word, index) => {
              const isDisabled = selected.includes(word)
              return (
                <Button
                  className='ring-foreground-50 bg-foreground-50/50 hover:ring-foreground-100 size-auto rounded-xs px-2 ring-1'
                  type='button'
                  key={index}
                  isDisabled={isDisabled}
                  onPress={() => handleClick(word)}>
                  <span className='font-number text-foreground-400'>{word}</span>
                </Button>
              )
            })}
          </div>

          <hr className='border-t-foreground-50/75 border-t-1' />

          <div className='grid w-full grid-cols-4 justify-between gap-x-2 gap-y-4'>
            {Array.from({ length: mnemonic.length }, (_, index) => (
              <div className='font-number flex h-6 items-center gap-1 select-none' key={index}>
                <span className='text-foreground-400 w-5.5 text-center text-sm font-medium'>
                  {index + 1}.
                </span>
                <span className='font-medium'>{selected[index]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isValid && (
        <motion.div
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
              className='ring-foreground-50 focus:ring-foreground-100 h-12 rounded-xs px-4 tracking-widest ring-1 outline-none focus:ring-2'
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
              className='ring-foreground-50 focus:ring-foreground-100 h-12 rounded-xs px-4 tracking-widest ring-1 outline-none focus:ring-2'
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
          className='bg-foreground/5 text-foreground-400 rounded-xs'
          type='button'
          aria-label='Button cancel'
          isDisabled={isLoading}
          onPress={onClose}>
          <span className='text-sm capitalize'>cancel</span>
        </Button>

        <Button
          className='bg-foreground text-background grow rounded-xs'
          type='submit'
          aria-label='Button create'
          isLoading={isLoading}
          isDisabled={!isValid || isLoading}>
          <span className='font-bold capitalize'>create</span>
        </Button>
      </div>
    </motion.form>
  )
}
