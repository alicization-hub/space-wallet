'use client'

import { useCallback, useEffect, useState } from 'react'

import { ClockIcon, TrendingUpIcon, ZapIcon } from '@/components/icons'
import { getFee } from '@/libs/actions/fee'
import { cls } from '@/libs/utils'

import { LabelComponent } from './input-label'

export function FeeComponent({
  onChange
}: Readonly<{
  onChange?: (value: number) => void
}>) {
  // __STATE's
  const [currentIndex, setCurrentIndex] = useState<number>(2)
  const [state, setState] = useState<Fee[]>([])

  // __FUNCTION's
  const handleChoose = useCallback(
    (index: number, value: number) => {
      setCurrentIndex(index)
      if (onChange) onChange(value)
    },
    [onChange]
  )

  const getIcon = useCallback((label: string) => {
    switch (label) {
      case 'highest':
        return <ZapIcon className='mx-auto size-6' />

      case 'medium':
        return <TrendingUpIcon className='mx-auto size-6' />

      case 'economy':
        return <TrendingUpIcon className='mx-auto size-6' />

      case 'lowest':
        return <ClockIcon className='mx-auto size-6' />
    }
  }, [])

  // __EFFECT's
  useEffect(() => {
    async function func() {
      try {
        const result = await getFee()
        setState(result)

        const { value } = result[2]
        handleChoose(2, value)
      } catch (error) {
        console.error(error)
      }
    }

    const timeoutId = setTimeout(() => func(), 200)
    return () => clearTimeout(timeoutId)
  }, [])

  // __RENDER
  return (
    <div className='flex flex-col gap-2'>
      <LabelComponent
        title='transaction fee'
        description='Recommended fee listed by mempool.space'
        required
      />

      <div className='grid grid-cols-4 gap-4'>
        {state.length > 0
          ? state.map((fee, index) => (
              <button
                className={cls(
                  'rounded-xs py-5',
                  currentIndex === index
                    ? 'bg-foreground-50/25 ring-foreground-100 shadow-foreground/10 shadow-2xl ring-2'
                    : 'ring-foreground-50 hover:ring-foreground-100 ring-1'
                )}
                aria-label={`Button fee - ${fee.label}`}
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
                className='bg-foreground-50/25 ring-foreground-50 h-32 animate-pulse rounded-xs ring-1'
                key={index}
              />
            ))}
      </div>
    </div>
  )
}
