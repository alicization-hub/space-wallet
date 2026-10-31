"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { FileTextIcon, TriangleAlertIcon } from "@keyline-icons/react"
import { useCallback, useMemo, useTransition } from "react"
import { useForm } from "react-hook-form"

import { syncAccount } from "@/actions/account/update"
import { createTransaction } from "@/actions/transaction/create"
import {
  createValidator,
  type CreateValidator
} from "@/actions/transaction/validator.zod"
import { Button } from "@/components/ui/button"
import { InputLabel } from "@/components/ui/input-label"
import { toast } from "@/components/ui/toast"
import { calcEstimator, satsToBitcoin } from "@/libs/bitcoin/unit"

export function SendConfirm({
  accountId,
  purpose,
  formData,
  onFinish,
  onClose
}: Readonly<{
  accountId: string
  purpose: Purpose
  formData: Omit<CreateValidator, "passphrase">
  onFinish?: () => void
  onClose?: () => void
}>) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors: error }
  } = useForm<CreateValidator>({
    resolver: zodResolver(createValidator),
    defaultValues: formData
  })

  const [isPending, startTransition] = useTransition()

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
        address: purpose === 84 ? "bc1q..." : "bc1p...",
        amount: 0,
        isRecipient: false,
        isChange: true
      }
    ]

    return calcEstimator(formData.fee, inputs, outputs)
  }, [purpose, formData])

  const handleClick = useCallback(
    (values: CreateValidator) => {
      startTransition(async () => {
        const sending = createTransaction(accountId, values)

        toast({
          promise: sending,
          description: "🚀 Your transaction was in processing and broadcasting...",
          hasCloseButton: false
        })

        const result = await sending
        if (result.success) {
          toast({
            title: "✅ Success",
            description: result.message,
            timeout: 0
          })

          if (onFinish) onFinish()

          // Not awaited: the money has gone out, so a failure here must not read as a failed send
          syncAccount(accountId)
        } else if (result.isUnknown) {
          // It stays up and the form closes, because sending again from other coins could pay twice
          toast({
            title: "⚠️ It may have gone out",
            description: result.message,
            timeout: 0
          })

          if (onFinish) onFinish()

          syncAccount(accountId)
        } else {
          toast({
            timeout: 9e3,
            title: "⚠️ An error occurred",
            description: result.message
          })
        }
      })
    },
    [accountId, onFinish]
  )

  return (
    <form className='flex flex-col gap-4' onSubmit={handleSubmit(handleClick)}>
      <div className='flex items-center justify-center gap-2 select-none'>
        <FileTextIcon className='size-5' />
        <span className='font-number text-lg font-medium capitalize'>
          transaction summary
        </span>
      </div>

      <div className='flex flex-col gap-6'>
        <div className='border-y-foreground/5 flex flex-col gap-2 border-y-2 py-4'>
          <div className='flex flex-col gap-1'>
            <div className='text-foreground-500 text-sm capitalize'>recipient</div>
            <div className='font-number font-medium break-all'>
              {formData.recipientAddress}
            </div>
          </div>

          <div className='flex items-center justify-between gap-4'>
            <div className='text-foreground-500 text-sm capitalize'>
              total amount to send
            </div>
            <div className='font-number font-medium'>
              {satsToBitcoin(summary.totalAmount).toFixed(8)} BTC
            </div>
          </div>

          <div className='flex items-center justify-between gap-4'>
            <div className='text-foreground-500 text-sm capitalize'>total input</div>
            <div className='font-number font-medium'>
              {satsToBitcoin(summary.totalInput).toFixed(8)} BTC
            </div>
          </div>

          <div className='flex items-center justify-between gap-4'>
            <div className='text-foreground-500 text-sm capitalize'>total fee</div>
            <div className='font-number font-medium'>
              {satsToBitcoin(summary.fee).toFixed(8)} BTC
            </div>
          </div>

          <div className='flex items-center justify-between gap-4'>
            <div className='text-foreground-500 text-sm capitalize'>change amount</div>
            <div className='font-number font-medium'>
              {summary.isDust ? (
                <>
                  {summary.changeAmount > 0 && (
                    <span className='text-sm text-red-400'>(Dust Threshold)</span>
                  )}
                  <span className='pl-2'>{`${Math.max(summary.changeAmount, 0)} Satoshis`}</span>
                </>
              ) : (
                `${satsToBitcoin(summary.changeAmount).toFixed(8)} BTC`
              )}
            </div>
          </div>

          {summary.isInsufficientFee && (
            <div className='text-right text-sm text-red-400'>Insufficient Fees</div>
          )}
        </div>

        <div className='flex flex-col gap-2'>
          <InputLabel
            title='passphrase'
            description='Enter your wallet passphrase to confirm the transaction.'
            isRequired
          />

          <input
            className='ring-foreground-50 focus:ring-foreground-100 h-12 rounded-xs px-4 font-semibold tracking-widest ring-1 outline-none placeholder:text-sm focus:ring-2'
            type='password'
            autoComplete='off'
            aria-label='Passphrase'
            disabled={isPending}
            {...register("passphrase")}
          />

          {error.passphrase && (
            <div className='text-xs text-red-500'>{error.passphrase.message}</div>
          )}
        </div>

        <div className='bg-foreground-100/25 flex items-center gap-4 rounded-xs px-4 py-3'>
          <TriangleAlertIcon className='size-7' />
          <span className='text-foreground-500 text-xs'>
            Bitcoin transactions are irreversible. Make sure the data is correct.
          </span>
        </div>
      </div>

      <div className='flex justify-center gap-4'>
        <Button
          className='bg-foreground/5 text-foreground-400 rounded-xs'
          aria-label='Button cancel'
          disabled={isPending}
          onClick={onClose}>
          <span className='text-sm capitalize'>cancel</span>
        </Button>

        <Button
          className='bg-foreground text-background rounded-xs px-8'
          type='submit'
          aria-label='Button send'
          isLoading={isPending}
          disabled={!watch("passphrase") || summary.isInsufficientFee}>
          <span className='font-bold capitalize'>send</span>
        </Button>
      </div>
    </form>
  )
}
