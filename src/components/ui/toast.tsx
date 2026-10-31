"use client"

import { XIcon } from "@keyline-icons/react"
import { AnimatePresence, m } from "framer-motion"
import { create } from "zustand"

import { Spinner } from "./spinner"

type Toast = {
  id: number
  title?: string
  description?: string
  isPending: boolean
  hasCloseButton: boolean
}

type ToastOptions = {
  title?: string
  description?: string
  /** Milliseconds on screen. `0` keeps it until it is closed. */
  timeout?: number
  /** Shows a spinner and closes the toast when this settles, whatever `timeout` says. */
  promise?: Promise<unknown>
  hasCloseButton?: boolean
}

const MAX_VISIBLE = 6
const DEFAULT_TIMEOUT = 3_000

const useToasts = create<{ toasts: Toast[] }>(() => ({ toasts: [] }))

let nextId = 0

function dismiss(id: number) {
  useToasts.setState(({ toasts }) => ({
    toasts: toasts.filter((toast) => toast.id !== id)
  }))
}

/**
 * Shows a toast from anywhere in the client.
 *
 * @example
 * ```ts
 * toast({ title: "✅ Success", description: "Copied." })
 * toast({ description: "Sending…", promise: send(), hasCloseButton: false })
 * ```
 */
export function toast({
  title,
  description,
  timeout = DEFAULT_TIMEOUT,
  promise,
  hasCloseButton = true
}: ToastOptions) {
  const id = ++nextId

  useToasts.setState(({ toasts }) => ({
    toasts: [
      ...toasts,
      { id, title, description, hasCloseButton, isPending: promise !== undefined }
    ].slice(-MAX_VISIBLE)
  }))

  if (promise) {
    const close = () => dismiss(id)
    promise.then(close, close)
  } else if (timeout > 0) {
    setTimeout(() => dismiss(id), timeout)
  }

  return id
}

export function ToastViewport({}: Readonly<{}>) {
  const toasts = useToasts((state) => state.toasts)

  return (
    <div
      className='pointer-events-none fixed top-16 right-4 z-60 flex w-full max-w-80 flex-col gap-2'
      role='status'
      aria-live='polite'>
      <AnimatePresence initial={false}>
        {toasts.map((item) => (
          <m.div
            className='bg-background ring-space-600/20 pointer-events-auto flex items-start gap-3 rounded-xs p-4 shadow-xl ring-1'
            key={item.id}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}>
            {item.isPending && <Spinner className='mt-2' size='sm' />}

            <div className='flex min-w-0 grow flex-col gap-0.5 text-sm wrap-break-word'>
              {item.title && <div className='font-medium'>{item.title}</div>}
              {item.description && (
                <div className='text-space-300'>{item.description}</div>
              )}
            </div>

            {item.hasCloseButton && (
              <button
                className='focus-visible:ring-space-100/40 size-5 shrink-0 rounded-xs opacity-60 outline-none hover:opacity-100 focus-visible:ring-2'
                type='button'
                aria-label='Close'
                onClick={() => dismiss(item.id)}>
                <XIcon className='size-5' />
              </button>
            )}
          </m.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
