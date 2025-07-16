'use client'

import { Button, useDisclosure } from '@heroui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { DangerIcon, SendIcon } from '@/components/icons'
import { LabelComponent } from '@/components/ui/input-label'
import { ModalComponent } from '@/components/ui/modal'
import { createValidator, type CreateValidator } from '@/libs/actions/transaction/validator'

import { AmountComponent } from './amount'
import { ConfirmComponent } from './confirm'
import { FeeComponent } from './fee'
import { UtxoComponent } from './utxo-selection'

const formValidator = createValidator.omit({ passphrase: true })
type FormValidator = Omit<CreateValidator, 'passphrase'>

export function FormComponent({ onClose }: Readonly<{ onClose?: () => void }>) {
  // __STATE's
  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors: error }
  } = useForm<FormValidator>({
    resolver: zodResolver(formValidator)
  })

  const [isDisabled, setIsDisabled] = useState<boolean>(false)
  const m = useDisclosure()

  // __FUNCTION's
  const handleClick = useCallback(() => {
    setIsDisabled(true)
    m.onOpen()
  }, [])

  // __RENDER
  return (
    <form className='flex flex-col gap-4' onSubmit={handleSubmit(handleClick)}>
      <div className='flex gap-4 select-none'>
        <SendIcon className='size-7' />
        <div className='font-number flex items-center gap-2 capitalize'>
          <span className='text-xl font-medium'>send bitcoin</span>
          <span className='rounded-xl bg-orange-800/10 px-2 py-0.5 text-xs text-orange-400'>on-chain</span>
        </div>
      </div>

      <div className='border-y-foreground/5 flex flex-col justify-center gap-6 border-y-2 py-8'>
        <div className='flex flex-col gap-2'>
          <LabelComponent
            title='recipient address'
            description='Enter the address you want to send (Only Native Segwit & Taproot address are allowed)'
            required
          />

          <input
            className='ring-foreground-50 focus:ring-foreground-100 placeholder:text-foreground-300 h-12 rounded-xs px-4 ring-1 outline-none placeholder:text-sm focus:ring-2'
            placeholder='bc1q... or bc1p...'
            {...register('recipientAddress')}
          />

          {error.recipientAddress && (
            <div className='text-xs text-red-500'>{error.recipientAddress.message}</div>
          )}
        </div>

        <AmountComponent onChange={(value) => setValue('amount', value)} />
        <UtxoComponent onChange={(utxos) => setValue('utxos', utxos)} />
        <FeeComponent onChange={(value) => setValue('fee', value)} />

        {/* <div className='flex flex-col gap-2'>
          <div className='flex flex-col'>
            <div className='font-medium capitalize'>transaction notes</div>
            <div className='text-foreground-400 text-xs'>
              Lorem ipsum dolor sit amet consectetur, adipisicing elit. <i>(optional)</i>
            </div>
          </div>

          <textarea
            className='ring-foreground-50 focus:ring-foreground-100 max-h-36 min-h-16 resize-y rounded-xs p-4 ring-1 outline-none focus:ring-2'
            {...register('notes')}
          />
        </div> */}

        <div className='bg-foreground-100/25 flex items-center gap-4 rounded-xs p-4'>
          <DangerIcon className='size-7' />
          <div className='flex flex-col text-sm'>
            <b className='text-foreground-700'>Double-check the recipient address</b>
            <span className='text-foreground-500 text-xs'>
              Bitcoin transactions are irreversible. Make sure the address is correct.
            </span>
          </div>
        </div>
      </div>

      <div className='flex justify-center gap-4'>
        <Button
          className='bg-foreground/5 text-foreground-400 rounded-xs'
          type='button'
          aria-label='Button close'
          isDisabled={isDisabled}
          onPress={onClose}>
          <span className='text-sm capitalize'>close</span>
        </Button>

        <Button
          className='bg-foreground text-background rounded-xs px-8'
          type='submit'
          aria-label='Button continue'
          isDisabled={isDisabled}>
          <span className='font-bold capitalize'>continue</span>
        </Button>
      </div>

      <ModalComponent control={m} placement='center' size='md' key='.confiem-modal'>
        <ConfirmComponent
          formData={getValues()}
          onSuccess={() => {
            m.onClose()
            setTimeout(() => onClose?.(), 200)
          }}
          onClose={() => {
            m.onClose()
            setIsDisabled(false)
          }}
        />
      </ModalComponent>
    </form>
  )
}
