"use client"

import { useCallback, useState } from "react"

import { Button } from "@/components/ui/button"
import { InputLabel } from "@/components/ui/input-label"
import { NumberInput } from "@/components/ui/number-input"
import { satsToBitcoin } from "@/libs/bitcoin/unit"

export function SendAmount({
  spendable,
  error,
  onChange
}: Readonly<{
  spendable: number
  error?: string
  onChange?: (value: number) => void
}>) {
  const [amount, setAmount] = useState<number>()

  const handleChange = useCallback(
    (value: number) => {
      setAmount(value)
      if (onChange) onChange(value)
    },
    [onChange]
  )

  const handleClick = useCallback(
    (percentage: number) => {
      handleChange(satsToBitcoin(Math.round(spendable * percentage)))
    },
    [spendable, handleChange]
  )

  return (
    <div className='flex flex-col gap-2'>
      <InputLabel
        title='amount'
        description='Enter the amount to send (BTC)'
        isRequired
      />

      <div className='flex items-center justify-between gap-4'>
        <NumberInput
          label='Amount'
          placeholder='0.0000'
          minValue={0.00001}
          maxValue={2}
          value={amount}
          onValueChange={handleChange}
        />

        <div className='flex gap-2'>
          {[25, 50, 75, 100].map((percentage) => (
            <Button
              className='ring-foreground-50 bg-foreground-50/25 h-12 min-w-fit rounded-xs ring-2'
              key={percentage}
              aria-label={`Button percentage ${percentage}`}
              onClick={() => handleClick(percentage / 100)}>
              <span className='text-foreground-600 text-sm font-medium'>
                {percentage}%
              </span>
            </Button>
          ))}
        </div>
      </div>

      {error && <div className='text-xs text-red-500'>{error}</div>}
    </div>
  )
}
