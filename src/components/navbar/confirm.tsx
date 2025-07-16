'use client'

import { Button } from '@heroui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'

import { SwapIcon } from '@/components/icons'
import { switchAccount } from '@/libs/actions/account'
import { SwitchValidator as FormValidator, switchValidator } from '@/libs/actions/account/validator'
import { type Schema } from '@/libs/drizzle/types'
import { toast } from '@/libs/utils'

export function ConfirmComponent({
  wallet,
  account,
  onClose
}: Readonly<{
  wallet: Schema.iWallet
  account: Schema.iAccount
  onClose?: () => void
}>) {
  // __STATE's
  const {
    register,
    handleSubmit,
    formState: { errors: error }
  } = useForm<FormValidator>({
    resolver: zodResolver(switchValidator),
    defaultValues: {
      walletId: wallet.id,
      accountId: account.id
    }
  })

  const [isLoading, setIsLoading] = useState<boolean>(false)

  // __FUNCTION's
  const handleClick = useCallback(async (formData: FormValidator) => {
    setIsLoading(true)

    try {
      const result = await switchAccount(formData)
      if (result) {
        setTimeout(() => location.assign(`/`), 1e3)
        toast({
          title: '✅ Successfully',
          description: 'Switch account successfully',
          timeout: 3e3
        })
      }
    } catch (error: any) {
      console.error('⚠️ An error occurred:', error)
      setIsLoading(false)
      toast({
        title: '⚠️ Wraning',
        description: error?.message || 'An error occurred.'
      })
    }
  }, [])

  // __RENDER
  return (
    <form className='flex flex-col gap-4' onSubmit={handleSubmit(handleClick)}>
      <div className='flex gap-4 select-none'>
        <SwapIcon className='size-6 rotate-90' />
        <div className='font-number text-xl font-medium capitalize'>change account</div>
      </div>

      <div className='border-y-foreground/5 flex flex-col justify-center gap-6 border-y-2 py-8'>
        <div className='flex items-center justify-center gap-2 capitalize'>
          <span className='text-foreground-500'>target:</span>
          <span className='font-bold'>
            {wallet.name} wallet/{account.label}
          </span>
        </div>

        <div className='flex flex-col gap-1'>
          <label className='text-foreground-500 text-sm font-medium capitalize'>
            passphrase <small className='text-red-500'>*</small>
          </label>

          <input
            className='bg-foreground/5 h-12 rounded-xs px-4 py-2 tracking-widest outline-none'
            type='password'
            {...register('passphrase')}
          />

          {error?.passphrase?.message && (
            <div className='text-xs text-red-400'>{error.passphrase.message}</div>
          )}
        </div>
      </div>

      <div className='flex justify-center gap-4'>
        <Button
          className='bg-foreground/5 text-foreground-400 rounded-xs'
          type='button'
          aria-label='Button close'
          isDisabled={isLoading}
          onPress={onClose}>
          <span className='text-sm capitalize'>close</span>
        </Button>

        <Button
          className='bg-foreground text-background rounded-xs px-8'
          type='submit'
          aria-label='Button submit'
          isLoading={isLoading}>
          <span className='font-bold capitalize'>confirm</span>
        </Button>
      </div>
    </form>
  )
}
