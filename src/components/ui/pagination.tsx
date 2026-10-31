"use client"

import { useMemo } from "react"

import { cls } from "@/libs/utils"

import { Button } from "./button"

/**
 * The first page, the last page, and the current page with its neighbours. `null` marks a gap.
 */
function createPages(page: number, total: number) {
  const pages = [1, page - 1, page, page + 1, total]
    .filter((value) => value >= 1 && value <= total)
    .filter((value, index, all) => all.indexOf(value) === index)
    .sort((a, b) => a - b)

  return pages.flatMap((value, index) =>
    index > 0 && value - pages[index - 1] > 1 ? [null, value] : [value]
  )
}

export function Pagination({
  page,
  total,
  isDisabled,
  onChange
}: Readonly<{
  page: number
  total: number
  isDisabled?: boolean
  onChange?: (page: number) => void
}>) {
  const pages = useMemo(() => createPages(page, total), [page, total])

  return (
    <nav className='mx-auto flex items-center gap-1 pt-4' aria-label='Pagination'>
      {pages.map((value, index) =>
        value === null ? (
          <span
            className='text-space-500 w-10 text-center select-none'
            key={`gap-${index}`}>
            …
          </span>
        ) : (
          <Button
            className={cls(
              "font-number border-space-100/5 rounded-xs border-2",
              value === page ? "bg-space-50 text-background font-bold" : "bg-space-700/5"
            )}
            key={value}
            isIconOnly
            disabled={isDisabled}
            aria-label={`Page ${value}`}
            aria-current={value === page ? "page" : undefined}
            onClick={() => onChange?.(value)}>
            {value}
          </Button>
        )
      )}
    </nav>
  )
}
