"use client"

import { ChevronRightIcon } from "@keyline-icons/react/two-tone"
import { AnimatePresence, m, type Variants } from "framer-motion"
import Link from "next/link"
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState
} from "react"

import { cls } from "@/libs/utils"

const POP: Variants = {
  enter: { opacity: 1, y: 0, transition: { duration: 0.12, ease: "easeOut" } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.1, ease: "easeOut" } }
}

const SLIDE: Variants = {
  enter: { opacity: 1, x: 0, transition: { duration: 0.12, ease: "easeOut" } },
  exit: { opacity: 0, x: -4, transition: { duration: 0.1, ease: "easeOut" } }
}

const PANEL =
  "bg-foreground-50/95 ring-space-50/10 absolute z-20 flex min-w-60 flex-col gap-0.5 rounded-xs p-1 shadow-xl ring-1 backdrop-blur-lg"

type MenuState = {
  close: () => void
  openGroupId: string | null
  toggleGroup: (id: string) => void
}

const MenuContext = createContext<MenuState | null>(null)

function useMenuContext() {
  const context = use(MenuContext)
  if (!context) throw new Error("Menu parts must be used within Menu")

  return context
}

/**
 * A dropdown that opens and closes on click only, never on hover, so it can't open by accident while
 * the pointer crosses the navbar. It closes on a click outside it, on Esc, and when an item is chosen.
 *
 * It follows the disclosure pattern rather than ARIA's `menu` role: its items are links between pages,
 * which Tab already reaches.
 *
 * @example
 * ```tsx
 * <Menu label='Wallets' trigger={<MenuSparklesIcon className='size-8' />}>
 *   <MenuGroup label='Wallets'>
 *     <MenuSubGroup icon={<WalletIcon className='size-4' />} label='Cold'>
 *       <MenuItem href='/account?vid=…'>Savings</MenuItem>
 *     </MenuSubGroup>
 *   </MenuGroup>
 * </Menu>
 * ```
 */
export function Menu({
  children,
  label,
  trigger,
  className,
  triggerClassName
}: Readonly<{
  children: React.ReactNode
  label: string
  trigger: React.ReactNode
  className?: string
  triggerClassName?: string
}>) {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [openGroupId, setOpenGroupId] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  const close = useCallback(() => {
    setIsOpen(false)
    setOpenGroupId(null)
  }, [])

  const handleToggle = useCallback(() => {
    setIsOpen((isOpen) => !isOpen)
    setOpenGroupId(null)
  }, [])

  const toggleGroup = useCallback((id: string) => {
    setOpenGroupId((openId) => (openId === id ? null : id))
  }, [])

  const context = useMemo(
    () => ({ close, openGroupId, toggleGroup }),
    [close, openGroupId, toggleGroup]
  )

  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) close()
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return

      close()
      triggerRef.current?.focus({ preventScroll: true })
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, close])

  return (
    <MenuContext value={context}>
      <div className={cls("relative", className)} ref={rootRef}>
        <button
          className={cls(
            "focus-visible:ring-space-100/40 rounded-xs outline-none focus-visible:ring-2",
            triggerClassName
          )}
          ref={triggerRef}
          type='button'
          aria-label={label}
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={handleToggle}>
          {trigger}
        </button>

        <AnimatePresence>
          {isOpen && (
            <m.div
              className={cls(PANEL, "top-full left-0 mt-2")}
              id={panelId}
              key='menu'
              aria-label={label}
              variants={POP}
              initial='exit'
              animate='enter'
              exit='exit'>
              {children}
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </MenuContext>
  )
}

/**
 * A titled section of a menu.
 */
export function MenuGroup({
  children,
  label
}: Readonly<{ children: React.ReactNode; label: string }>) {
  const labelId = useId()

  return (
    <div className='flex flex-col gap-0.5' role='group' aria-labelledby={labelId}>
      <div
        className='text-foreground-500 px-2.5 pt-1.5 pb-1 text-[0.6875rem] font-medium tracking-wider uppercase'
        id={labelId}>
        {label}
      </div>
      {children}
    </div>
  )
}

/**
 * A row that opens its items in a panel to its right. Only one opens at a time, and only on click.
 */
export function MenuSubGroup({
  children,
  icon,
  label,
  isCurrent
}: Readonly<{
  children: React.ReactNode
  icon?: React.ReactNode
  label: string
  isCurrent?: boolean
}>) {
  const { openGroupId, toggleGroup } = useMenuContext()
  const id = useId()
  const isOpen = openGroupId === id

  const handleClick = useCallback(() => toggleGroup(id), [toggleGroup, id])

  return (
    <div className='relative'>
      <button
        className={cls(
          "focus-visible:ring-space-100/40 flex h-9 w-full items-center justify-start gap-2.5 rounded-xs px-2.5 text-sm transition-colors outline-none focus-visible:ring-2",
          isOpen ? "bg-space-50/10" : "hover:bg-space-50/5",
          isCurrent ? "text-foreground" : "text-foreground-600"
        )}
        type='button'
        aria-expanded={isOpen}
        aria-controls={id}
        onClick={handleClick}>
        {icon}
        <span className='flex-1 truncate text-left'>{label}</span>
        <ChevronRightIcon
          className={cls(
            "text-foreground-500 size-4 transition-transform",
            isOpen && "translate-x-0.5"
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <m.div
            className={cls(PANEL, "top-0 left-full ml-2")}
            id={id}
            key='sub-group'
            role='group'
            aria-label={label}
            variants={SLIDE}
            initial='exit'
            animate='enter'
            exit='exit'>
            {children}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * A link in a menu. Choosing it closes the menu.
 */
export function MenuItem({
  children,
  className,
  isActive,
  onClick,
  ...rest
}: Readonly<
  React.ComponentProps<typeof Link> & {
    isActive?: boolean
  }
>) {
  const { close } = useMenuContext()

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event)
      close()
    },
    [onClick, close]
  )

  return (
    <Link
      className={cls(
        "focus-visible:ring-space-100/40 flex flex-col gap-0.5 rounded-xs px-2.5 py-2 transition-colors outline-none focus-visible:ring-2",
        isActive ? "bg-space-50/10" : "hover:bg-space-50/5",
        className
      )}
      aria-current={isActive ? "page" : undefined}
      onClick={handleClick}
      {...rest}>
      {children}
    </Link>
  )
}

/**
 * What a menu says when it has nothing to list.
 */
export function MenuEmpty({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className='text-foreground-500 px-2.5 py-2 text-xs font-light'>{children}</div>
  )
}
