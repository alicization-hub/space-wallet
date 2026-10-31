"use client"

import { CheckIcon, CopyIcon } from "@keyline-icons/react"
import { AnimatePresence, m } from "framer-motion"
import { useCallback, useEffect, useRef, useState } from "react"

import { cls } from "@/libs/utils"

import { toast } from "./toast"

const COPIED_FOR = 2_000

/**
 * Shows a value with a button that copies it.
 */
export function Snippet({
  children,
  className,
  codeString,
  symbol
}: Readonly<{
  children: React.ReactNode
  className?: string
  codeString: string
  symbol?: string
}>) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null)
  const [isCopied, setIsCopied] = useState<boolean>(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(codeString)
      setIsCopied(true)

      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setIsCopied(false), COPIED_FOR)
    } catch {
      toast({
        title: "⚠️ Copy failed",
        description: "The browser blocked the clipboard."
      })
    }
  }, [codeString])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <div className={cls("flex w-fit items-center gap-2", className)}>
      {symbol && (
        <span className='text-space-400 font-number text-lg font-light select-none'>
          {symbol}
        </span>
      )}

      <div className='min-w-0'>{children}</div>

      <button
        className='focus-visible:ring-space-100/40 size-5 shrink-0 rounded-xs opacity-75 outline-none hover:opacity-100 focus-visible:ring-2'
        type='button'
        aria-label={isCopied ? "Copied" : "Copy to clipboard"}
        onClick={handleCopy}>
        <AnimatePresence initial={false} mode='wait'>
          <m.span
            className='flex items-center justify-center'
            key={isCopied ? "copied" : "copy"}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.1 }}>
            {isCopied ? (
              <CheckIcon className='size-4 text-green-300' />
            ) : (
              <CopyIcon className='size-4' />
            )}
          </m.span>
        </AnimatePresence>
      </button>
    </div>
  )
}
