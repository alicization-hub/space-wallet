"use client"

import { AnimatePresence, m, type Variants } from "framer-motion"
import { useEffect, useRef, useSyncExternalStore, type SubmitEvent } from "react"
import { createPortal } from "react-dom"

import { cls } from "@/libs/utils"

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

const FADE: Variants = {
  enter: { opacity: 1, transition: { duration: 0.1, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.1, ease: "easeOut" } }
}

/**
 * Open overlays, newest last. Only the top one traps focus, and the page scrolls again when the
 * last one closes. The send form opens a drawer and a modal over its own modal, so there can be
 * several.
 */
const stack: object[] = []

const subscribe = () => () => {}

/**
 * React events bubble through portals, so without this submitting a form in a nested overlay would
 * also submit the form that opened it.
 */
function handleSubmit(event: SubmitEvent) {
  event.stopPropagation()
}

/**
 * The part every overlay shares: portal, backdrop, focus trap, scroll lock and enter/exit
 * animation. Use `ModalComponent` or `DrawerComponent` rather than this.
 *
 * Overlays close only from inside, on purpose: an outside click or Esc must not throw away a
 * half-filled send form.
 */
export function Overlay({
  children,
  isOpen,
  label,
  className,
  wrapperClassName,
  variants
}: Readonly<{
  children: React.ReactNode
  isOpen: boolean
  label: string
  className?: string
  wrapperClassName?: string
  variants: Variants
}>) {
  const panelRef = useRef<HTMLDivElement>(null)
  const isMounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )

  useEffect(() => {
    if (!isOpen) return

    const entry = {}
    const previous = document.activeElement

    stack.push(entry)
    document.body.style.overflow = "hidden"
    panelRef.current?.focus({ preventScroll: true })

    function handleKeyDown(event: KeyboardEvent) {
      const panel = panelRef.current
      if (event.key !== "Tab" || !panel || stack.at(-1) !== entry) return

      const items = panel.querySelectorAll<HTMLElement>(FOCUSABLE)
      if (items.length === 0) {
        event.preventDefault()
        return
      }

      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement

      if (!active || !panel.contains(active)) {
        event.preventDefault()
        first.focus()
      } else if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      stack.splice(stack.indexOf(entry), 1)

      if (stack.length === 0) {
        document.body.style.overflow = ""
      }

      if (previous instanceof HTMLElement) {
        previous.focus({ preventScroll: true })
      }
    }
  }, [isOpen])

  if (!isMounted) return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <m.div
          className={cls(
            "bg-overlay/60 fixed inset-0 z-50 flex backdrop-blur-sm",
            wrapperClassName
          )}
          key='overlay'
          variants={FADE}
          initial='exit'
          animate='enter'
          exit='exit'
          onSubmit={handleSubmit}>
          <m.div
            className={cls(
              "bg-background ring-space-600/10 rounded-xs ring-4 outline-none",
              className
            )}
            ref={panelRef}
            role='dialog'
            aria-modal='true'
            aria-label={label}
            tabIndex={-1}
            variants={variants}>
            {children}
          </m.div>
        </m.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
