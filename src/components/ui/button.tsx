"use client"

import { m, type HTMLMotionProps } from "framer-motion"

import { cls } from "@/libs/utils"

import { Spinner } from "./spinner"

export function Button({
  children,
  className,
  disabled,
  type = "button",
  size = "md",
  isIconOnly,
  isLoading,
  ...rest
}: Readonly<
  Omit<HTMLMotionProps<"button">, "children"> & {
    children?: React.ReactNode
    size?: "sm" | "md"
    isIconOnly?: boolean
    isLoading?: boolean
  }
>) {
  const isDisabled = disabled || isLoading

  return (
    <m.button
      className={cls(
        "bg-foreground-100 focus-visible:ring-space-100/40 relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xs whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-2",
        "disabled:pointer-events-none disabled:opacity-50",
        size === "sm" ? "h-8 min-w-16 px-3 text-xs" : "h-10 min-w-20 px-4 text-sm",
        isIconOnly && (size === "sm" ? "w-8 min-w-8 px-0" : "w-10 min-w-10 px-0"),
        className
      )}
      type={type}
      disabled={isDisabled}
      whileTap={isDisabled ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.1 }}
      {...rest}>
      {isLoading && <Spinner size='sm' />}
      {children}
    </m.button>
  )
}
