'use client'

import { Button, NumberInput } from '@heroui/react'
import { useCallback, useState } from 'react'

import { LabelComponent } from '@/components/ui/input-label'
import { useWallet } from '@/hooks'
import { satsToBitcoin } from '@/libs/bitcoin/unit'

export function AmountComponent({
  error,
  onChange
}: Readonly<{
  error?: string
  onChange?: (value: number) => void
}>) {
  // __STATE's
  const { balance } = useWallet((state) => state.account)
  const [amount, setAmount] = useState<number>()

  // __FUNCTION's
  const handleClick = useCallback(
    (percentage: number) => {
      const value = satsToBitcoin(Math.round(balance.spendable * percentage))
      setAmount(value)
      if (onChange) onChange(value)
    },
    [amount, balance, onChange]
  )

  // __RENDER
  return (
    <div className='flex flex-col gap-2'>
      <LabelComponent title='amount' description='Enter the amount to send (BTC)' required />

      <div className='flex items-center justify-between gap-4'>
        <NumberInput
          classNames={{
            inputWrapper: 'p-0 h-auto border-none',
            input:
              'ring-foreground-50 focus:ring-foreground-100 placeholder:text-foreground-300 h-12 rounded-xs px-4 ring-1 outline-none placeholder:text-sm focus:ring-2'
          }}
          aria-label='Amount'
          placeholder='0.0000'
          variant='bordered'
          minValue={0.00001}
          maxValue={2}
          hideStepper
          isWheelDisabled
          value={amount}
          onValueChange={(value: number) => {
            setAmount(value)
            if (onChange) onChange(value)
          }}
          formatOptions={{
            minimumFractionDigits: 8,
            maximumFractionDigits: 8
          }}
        />

        <div className='flex gap-2'>
          {[25, 50, 75, 100].map((percentage) => (
            <Button
              className='ring-foreground-50 bg-foreground-50/25 h-12 min-w-fit rounded-xs ring-2'
              type='button'
              key={percentage}
              aria-label='Button percentage ${percentage}'
              onPress={() => handleClick(percentage / 100)}>
              <span className='text-foreground-600 text-sm font-medium'>{percentage}%</span>
            </Button>
          ))}
        </div>
      </div>

      {error && <div className='text-xs text-red-500'>{error}</div>}
    </div>
  )
}
