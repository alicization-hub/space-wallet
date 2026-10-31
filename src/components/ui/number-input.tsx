"use client"

import { useCallback, useEffect, useState, type ChangeEvent } from "react"

import { cls } from "@/libs/utils"

const DECIMALS = 8

/**
 * Digits with at most 8 decimals. A `type="number"` input would accept exponents and change value
 * on scroll, neither of which belongs in an amount of money.
 */
const AMOUNT_PATTERN = new RegExp(`^\\d*\\.?\\d{0,${DECIMALS}}$`)

/**
 * An amount in BTC. It reports `NaN` while empty, so a validator can reject it.
 */
export function NumberInput({
  className,
  value,
  minValue,
  maxValue,
  placeholder,
  label,
  onValueChange
}: Readonly<{
  className?: string
  value?: number
  minValue?: number
  maxValue?: number
  placeholder?: string
  label: string
  onValueChange?: (value: number) => void
}>) {
  const [text, setText] = useState<string>(
    value === undefined ? "" : value.toFixed(DECIMALS)
  )

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value
      if (!AMOUNT_PATTERN.test(next)) return

      setText(next)
      onValueChange?.(next === "" || next === "." ? Number.NaN : Number(next))
    },
    [onValueChange]
  )

  const handleBlur = useCallback(() => {
    const parsed = Number(text)
    if (text === "" || text === "." || Number.isNaN(parsed)) return

    const clamped = Math.min(Math.max(parsed, minValue ?? parsed), maxValue ?? parsed)

    setText(clamped.toFixed(DECIMALS))
    if (clamped !== parsed) onValueChange?.(clamped)
  }, [text, minValue, maxValue, onValueChange])

  useEffect(() => {
    if (value !== undefined && !Number.isNaN(value) && value !== Number(text)) {
      setText(value.toFixed(DECIMALS))
    }
  }, [value])

  return (
    <input
      className={cls(
        "ring-foreground-50 focus:ring-foreground-100 placeholder:text-foreground-300 h-12 w-full rounded-xs px-4 ring-1 outline-none placeholder:text-sm focus:ring-2",
        className
      )}
      type='text'
      inputMode='decimal'
      autoComplete='off'
      aria-label={label}
      placeholder={placeholder}
      value={text}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  )
}
