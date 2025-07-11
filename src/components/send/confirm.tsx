'use client'

import { Button } from '@heroui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'

import { useWallet } from '@/hooks'
import { createTransaction } from '@/libs/actions/transaction/create'
import { createValidator, type CreateValidator } from '@/libs/actions/transaction/validator'
import { bitcoinToSats, calcEstimator, satsToBitcoin } from '@/libs/bitcoin/unit'
import { toast } from '@/libs/utils'

import { DangerIcon, DocumentIcon } from '../icons'
import { LabelComponent } from './input-label'

export function ConfirmComponent({
  formData,
  onSuccess,
  onClose
}: Readonly<{
  formData: Omit<CreateValidator, 'passphrase'>
  onSuccess?: () => void
  onClose?: () => void
}>) {
  // __STATE's
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors: error }
  } = useForm<CreateValidator>({
    resolver: zodResolver(createValidator),
    defaultValues: formData
  })

  const [isLoading, setIsLoading] = useState<boolean>(false)

  const account = useWallet((state) => state.account)
  const summary = useMemo(() => {
    const inputs = formData.utxos as any[]
    const outputs: Transaction.PrepareOutput[] = [
      {
        address: formData.recipientAddress,
        amount: formData.amount,
        isRecipient: true,
        isChange: false
      },
      {
        address: account.purpose === 84 ? 'bc1q...' : 'bc1p...',
        amount: 0,
        isRecipient: false,
        isChange: true
      }
    ]

    return calcEstimator(bitcoinToSats(formData.amount), formData.fee, inputs, outputs)
  }, [account, formData])

  // __FUNCTION's
  const handleClick = useCallback((formData: CreateValidator) => {
    const func = async (resolve: (value: any) => void) => {
      try {
        const result = await createTransaction(formData)
        if (result.success) {
          resolve(true)
          toast({
            title: '✅ Success',
            description: result.message
          })

          if (onSuccess) onSuccess()
        }
      } catch (error: any) {
        console.error('⚠️ An error occurred:', error)
        resolve(true)
        toast({
          timeout: 9e3,
          title: '⚠️ An error occurred',
          description:
            error?.message || 'Something went wrong while processing or broadcasting the transaction.'
        })
      }

      setIsLoading(false)
    }

    setIsLoading(true)
    toast({
      promise: new Promise((resolve) => func(resolve)),
      description: '🚀 Your transaction was in processing and broadcasting...',
      hideCloseButton: true
    })
  }, [])

  // __RENDER
  return (
    <form className='flex flex-col gap-4' onSubmit={handleSubmit(handleClick)}>
      <div className='flex items-center justify-center gap-2 select-none'>
        <DocumentIcon className='size-5' />
        <span className='font-number text-lg font-medium capitalize'>transaction summary</span>
      </div>

      <div className='flex flex-col gap-6'>
        <div className='border-y-foreground/5 flex flex-col gap-2 border-y-2 py-4'>
          <div className='flex items-center justify-between gap-4'>
            <div className='text-foreground-500 text-sm capitalize'>total amount to send</div>
            <div className='font-number font-medium'>{formData.amount.toFixed(8)} BTC</div>
          </div>

          <div className='flex items-center justify-between gap-4'>
            <div className='text-foreground-500 text-sm capitalize'>total input</div>
            <div className='font-number font-medium'>{satsToBitcoin(summary.total).toFixed(8)} BTC</div>
          </div>

          <div className='flex items-center justify-between gap-4'>
            <div className='text-foreground-500 text-sm capitalize'>total fee</div>
            <div className='font-number font-medium'>{satsToBitcoin(summary.fee).toFixed(8)} BTC</div>
          </div>

          <div className='flex items-center justify-between gap-4'>
            <div className='text-foreground-500 text-sm capitalize'>change amount</div>
            <div className='font-number font-medium'>
              {summary.changeAmount >= 0 ? (
                `${satsToBitcoin(summary.changeAmount).toFixed(8)} BTC`
              ) : (
                <span className='text-red-400'>Insufficient total input</span>
              )}
            </div>
          </div>
        </div>

        <div className='flex flex-col gap-2'>
          <LabelComponent
            title='passphrase'
            description='Enter your wallet passphrase to confirm the transaction.'
            required
          />

          <input
            className='ring-foreground-50 focus:ring-foreground-100 h-12 rounded-xs px-4 font-semibold tracking-widest ring-1 outline-none placeholder:text-sm focus:ring-2'
            type='password'
            disabled={isLoading}
            {...register('passphrase')}
          />

          {error.passphrase && <div className='text-xs text-red-500'>{error.passphrase.message}</div>}
        </div>

        <div className='bg-foreground-100/25 flex items-center gap-4 rounded-xs px-4 py-3'>
          <DangerIcon className='size-7' />
          <span className='text-foreground-500 text-xs'>
            Bitcoin transactions are irreversible. Make sure the data is correct.
          </span>
        </div>
      </div>

      <div className='flex justify-center gap-4'>
        <Button
          className='bg-foreground/5 text-foreground-400 rounded-xs'
          type='button'
          aria-label='Button cancel'
          isDisabled={isLoading}
          onPress={onClose}>
          <span className='text-sm capitalize'>cancel</span>
        </Button>

        <Button
          className='bg-foreground text-background rounded-xs px-8'
          type='submit'
          aria-label='Button send'
          isLoading={isLoading}
          isDisabled={!watch('passphrase') || summary.changeAmount < 0}>
          <span className='font-bold capitalize'>send</span>
        </Button>
      </div>
    </form>
  )
}
