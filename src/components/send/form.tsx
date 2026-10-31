"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { SendIcon, TriangleAlertIcon } from "@keyline-icons/react"
import { useCallback, useState } from "react"
import { useForm } from "react-hook-form"

import {
  createValidator,
  type CreateValidator
} from "@/actions/transaction/validator.zod"
import { Button } from "@/components/ui/button"
import { InputLabel } from "@/components/ui/input-label"
import { ModalComponent } from "@/components/ui/modal"
import { useOverlayState } from "@/hooks"

import { SendAmount } from "./amount"
import { SendConfirm } from "./confirm"
import { SendFee } from "./fee"
import { UtxoSelection } from "./utxo-selection"

const formValidator = createValidator.omit({ passphrase: true })
type FormValidator = Omit<CreateValidator, "passphrase">

export function SendForm({
  accountId,
  purpose,
  spendable,
  onClose
}: Readonly<{
  accountId: string
  purpose: Purpose
  spendable: number
  onClose?: () => void
}>) {
  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors: error, isSubmitted }
  } = useForm<FormValidator>({
    resolver: zodResolver(formValidator)
  })

  const [isDisabled, setIsDisabled] = useState<boolean>(false)
  const modal = useOverlayState()

  const handleClick = useCallback(() => {
    setIsDisabled(true)
    modal.open()
  }, [modal])

  return (
    <form className='flex flex-col gap-4' onSubmit={handleSubmit(handleClick)}>
      <div className='flex gap-4 select-none'>
        <SendIcon className='size-7' />
        <div className='font-number flex items-center gap-2 capitalize'>
          <span className='text-xl font-medium'>send bitcoin</span>
          <span className='rounded-xl bg-orange-800/10 px-2 py-0.5 text-xs text-orange-400'>
            on-chain
          </span>
        </div>
      </div>

      <div className='border-y-foreground/5 flex flex-col justify-center gap-6 border-y-2 py-8'>
        <div className='flex flex-col gap-2'>
          <InputLabel
            title='recipient address'
            description='Enter the address you want to send (Only Native Segwit & Taproot address are allowed)'
            isRequired
          />

          <input
            className='ring-foreground-50 focus:ring-foreground-100 placeholder:text-foreground-300 h-12 rounded-xs px-4 ring-1 outline-none placeholder:text-sm focus:ring-2'
            autoComplete='off'
            spellCheck={false}
            placeholder='bc1q... or bc1p...'
            {...register("recipientAddress")}
          />

          {error.recipientAddress && (
            <div className='text-xs text-red-500'>{error.recipientAddress.message}</div>
          )}
        </div>

        <SendAmount
          spendable={spendable}
          error={error.amount?.message}
          onChange={(value) => setValue("amount", value, { shouldValidate: isSubmitted })}
        />
        <UtxoSelection
          error={error.utxos?.message}
          onChange={(utxos) => setValue("utxos", utxos, { shouldValidate: isSubmitted })}
        />
        <SendFee
          error={error.fee?.message}
          onChange={(value) => setValue("fee", value, { shouldValidate: isSubmitted })}
        />

        <div className='bg-foreground-100/25 flex items-center gap-4 rounded-xs p-4'>
          <TriangleAlertIcon className='size-7' />
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
          aria-label='Button close'
          disabled={isDisabled}
          onClick={onClose}>
          <span className='text-sm capitalize'>close</span>
        </Button>

        <Button
          className='bg-foreground text-background rounded-xs px-8'
          type='submit'
          aria-label='Button continue'
          disabled={isDisabled}>
          <span className='font-bold capitalize'>continue</span>
        </Button>
      </div>

      <ModalComponent
        control={modal}
        label='Transaction summary'
        placement='center'
        size='md'
        key='.confirm-modal'>
        <SendConfirm
          accountId={accountId}
          purpose={purpose}
          formData={getValues()}
          onFinish={() => {
            modal.close()
            setTimeout(() => onClose?.(), 200)
          }}
          onClose={() => {
            modal.close()
            setIsDisabled(false)
          }}
        />
      </ModalComponent>
    </form>
  )
}
