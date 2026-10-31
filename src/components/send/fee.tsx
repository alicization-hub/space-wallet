"use client"

import { ClockIcon, TrendingUpIcon, ZapIcon } from "@keyline-icons/react"
import { useCallback, useState, useTransition } from "react"

import { readFees } from "@/actions/fee"
import { InputLabel } from "@/components/ui/input-label"
import { useEffectSync } from "@/hooks"
import { cls } from "@/libs/utils"

export function SendFee({
  error,
  onChange
}: Readonly<{
  error?: string
  onChange?: (value: number) => void
}>) {
  const [currentIndex, setCurrentIndex] = useState<number>(2)
  const [state, setState] = useState<Fee[]>([])
  const [message, setMessage] = useState<string>()
  const [, startTransition] = useTransition()

  const handleChoose = useCallback(
    (index: number, value: number) => {
      setCurrentIndex(index)
      if (onChange) onChange(value)
    },
    [onChange]
  )

  const getIcon = useCallback((label: string) => {
    switch (label) {
      case "highest":
        return <ZapIcon className='mx-auto size-6' />

      case "medium":
        return <TrendingUpIcon className='mx-auto size-6' />

      case "economy":
        return <TrendingUpIcon className='mx-auto size-6' />

      case "lowest":
        return <ClockIcon className='mx-auto size-6' />
    }
  }, [])

  useEffectSync(() => {
    startTransition(async () => {
      const result = await readFees()
      if (result.success) {
        setState(result.data)
        handleChoose(2, result.data[2].value)
      } else {
        setMessage(result.message)
      }
    })
  }, 128)

  return (
    <div className='flex flex-col gap-2'>
      <InputLabel
        title='transaction fee'
        description='Recommended fee listed by mempool.space'
        isRequired
      />

      <div className='grid grid-cols-4 gap-4'>
        {state.length > 0
          ? state.map((fee, index) => (
              <button
                className={cls(
                  "rounded-xs py-5",
                  currentIndex === index
                    ? "bg-foreground-50/25 ring-foreground-100 shadow-foreground/10 shadow-2xl ring-2"
                    : "ring-foreground-50 hover:ring-foreground-100 ring-1"
                )}
                aria-label={`Button fee - ${fee.label}`}
                aria-pressed={currentIndex === index}
                type='button'
                key={fee.label}
                onClick={() => handleChoose(index, fee.value)}>
                <div className='flex flex-col justify-center text-center select-none'>
                  {getIcon(fee.label)}
                  <div className='mt-2 capitalize'>{fee.label}</div>
                  <div className='text-foreground-500 text-xs'>{fee.value} sat/vB</div>
                  <div className='text-foreground-500 text-xs'>{fee.duration}</div>
                </div>
              </button>
            ))
          : Array.from({ length: 4 }).map((_, index) => (
              <div
                className={cls(
                  "bg-foreground-50/25 ring-foreground-50 h-32 rounded-xs ring-1",
                  !message && "animate-pulse"
                )}
                key={index}
              />
            ))}
      </div>

      {message && <div className='text-xs text-red-500'>{message}</div>}

      {error && !message && <div className='text-xs text-red-500'>{error}</div>}
    </div>
  )
}
