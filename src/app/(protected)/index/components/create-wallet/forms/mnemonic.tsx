'use client'

import { Button } from '@heroui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { useCallback, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { CircleCheckIcon, DangerIcon, PencilRulerIcon, RefreshCwIcon } from '@/components/icons'
import { LabelComponent } from '@/components/ui/input-label'
import { generateMnemonic } from '@/libs/actions/wallet'
import { createWalletValidator } from '@/libs/actions/wallet/validator'
import { cls, delay, toast } from '@/libs/utils'

const formValidator = createWalletValidator.pick({ name: true, mnemonic: true })
type FormValidator = z.infer<typeof formValidator>

export function MnemonicComponent({
  onClose,
  onContinue
}: Readonly<{
  onClose?: () => void
  onContinue?: (values: FormValidator) => void
}>) {
  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    watch,
    formState: { errors: error }
  } = useForm<FormValidator>({
    resolver: zodResolver(formValidator)
  })

  const mnemonic = useMemo(() => getValues('mnemonic')?.split(/\s+/) || [], [watch('mnemonic')])
  const [length, setLength] = useState<MnemonicLength>(12)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // __FUNCTION's
  const handleContinue = useCallback((formData: FormValidator) => {
    if (onContinue) onContinue(formData)
  }, [])

  const handleClick = useCallback(async () => {
    setIsLoading(true)

    try {
      await delay(1e3)
      const result = await generateMnemonic(length)
      setValue('mnemonic', result)
    } catch (error: any) {
      console.error('⚠️ An error occurred:', error)
      toast({
        timeout: 5e3,
        title: '⚠️ An error occurred',
        description: error?.message || 'Something went wrong, please try again later.'
      })
    }

    setIsLoading(false)
  }, [length])

  // __RENDER
  return (
    <motion.form
      className='flex flex-col gap-6'
      initial={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -4 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      onSubmit={handleSubmit(handleContinue)}>
      <div className='flex flex-col gap-2'>
        <LabelComponent
          title='wallet name'
          description='Lorem ipsum dolor sit amet consectetur adipisicing elit.'
          required
        />

        <input className='form-input h-12 px-4' {...register('name')} />

        {error.name && <div className='text-xs text-red-500'>{error.name.message}</div>}
      </div>

      <div className='flex flex-col gap-2'>
        <LabelComponent
          title='mnemonic phrase length'
          description='Lorem ipsum dolor sit amet consectetur adipisicing elit.'
        />

        <div className='flex gap-4'>
          {[
            { label: '12 words', description: 'standard', value: 12 },
            { label: '24 words', description: 'enhanced security', value: 24 }
          ].map((record) => (
            <Button
              className={cls(
                'h-12 flex-1 flex-col gap-0 rounded-xs py-2 outline-none',
                length === record.value
                  ? 'bg-space-500/5 ring-space-100/10 shadow-space-500/5 shadow-xl ring-2'
                  : 'ring-space-100/5 hover:ring-space-100/10 bg-transparent ring-1'
              )}
              aria-label={`Button phrase length - ${record.value}`}
              type='button'
              key={record.value}
              onPress={() => setLength(record.value as MnemonicLength)}>
              <div className='text-sm capitalize'>{record.label}</div>
              <div className='text-space-600 text-xs capitalize'>{record.description}</div>
            </Button>
          ))}
        </div>
      </div>

      <div className='flex flex-col gap-2'>
        <div className='flex justify-between gap-8'>
          <LabelComponent
            title='your recovery mnemonic seed phrase'
            description='Lorem ipsum dolor sit amet consectetur adipisicing elit.'
            required
          />

          {mnemonic.length >= 12 && (
            <Button
              className='bg-space-700/5 ring-space-100/5 rounded-xs ring-2'
              type='button'
              aria-label='Button regenerate'
              isIconOnly
              isLoading={isLoading}
              onPress={handleClick}>
              <RefreshCwIcon className='size-5' />
            </Button>
          )}
        </div>

        <div className='rounded-xs bg-orange-700/5 p-4'>
          <div className='mb-2 flex items-center gap-2'>
            <DangerIcon className='size-5 stroke-orange-100' />
            <span className='font-medium text-orange-100'>Important Security Warning:</span>
          </div>

          <ul className='list-inside list-disc space-y-0.5 pl-1 text-sm text-orange-400'>
            <li>Write down these words in the exact order shown</li>
            <li>Store them in a secure, offline location</li>
            <li>Never share your recovery phrase with anyone</li>
            <li>Anyone with these words can access your wallet</li>
            <li>You cannot recover your wallet if you lose these words</li>
          </ul>
        </div>

        <div className='ring-space-100/5 flex flex-col justify-center rounded-xs p-4 ring-1'>
          {mnemonic.length >= 12 ? (
            <>
              <div className='grid w-full grid-cols-4 justify-between gap-x-2 gap-y-4'>
                {mnemonic.map((word, index) => (
                  <motion.div
                    className='font-number flex items-center gap-1 font-medium select-none'
                    key={`${word}-${index}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}>
                    <span className='text-space-600 w-5.5 text-center text-sm'>{index + 1}.</span>
                    <span className=''>{word}</span>
                  </motion.div>
                ))}
              </div>

              <div className='text-space-500 bg-space-500/5 mt-4 rounded-xs py-2 text-center text-xs'>
                You will not be able to see these words again once wallet is created.
              </div>
            </>
          ) : (
            <Button
              className='bg-space-50/5 text-space-200 mx-auto w-36 rounded-xs'
              type='button'
              aria-label='Button generate'
              isLoading={isLoading}
              onPress={handleClick}>
              {!isLoading && <PencilRulerIcon className='size-5 opacity-80' />}
              <span className='capitalize'>generate</span>
            </Button>
          )}
        </div>
      </div>

      <div className='bg-space-400/5 flex items-center gap-4 rounded-xs p-4'>
        <CircleCheckIcon className='size-7' />
        <span className='text-sm'>
          Make sure you have safely stored your recovery phrase before proceeding to verification.
        </span>
      </div>

      <div className='flex gap-4'>
        <Button
          className='bg-space-50/5 text-space-400 rounded-xs'
          type='button'
          aria-label='Button close'
          isDisabled={isLoading}
          onPress={onClose}>
          <span className='text-sm capitalize'>close</span>
        </Button>

        <Button
          className='bg-space-50 text-background grow rounded-xs'
          type='submit'
          aria-label='Button continue'
          isDisabled={!mnemonic.length || isLoading}>
          <span className='font-bold capitalize'>continue</span>
        </Button>
      </div>
    </motion.form>
  )
}
