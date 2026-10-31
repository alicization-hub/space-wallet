"use client"

import { m } from "framer-motion"

import { cls } from "@/libs/utils"

const DOTS = [0, 1, 2]

export function Spinner({
  className,
  size = "md"
}: Readonly<{
  className?: string
  size?: "sm" | "md" | "lg"
}>) {
  return (
    <span
      className={cls("inline-flex items-center gap-1", className)}
      role='status'
      aria-label='Loading'>
      {DOTS.map((dot) => (
        <m.span
          className={cls("rounded-full bg-current", {
            "size-1": size === "sm",
            "size-1.5": size === "md",
            "size-2": size === "lg"
          })}
          key={dot}
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: dot * 0.15 }}
        />
      ))}
    </span>
  )
}
