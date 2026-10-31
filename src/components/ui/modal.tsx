"use client"

import type { Variants } from "framer-motion"

import type { OverlayState } from "@/hooks"
import { cls } from "@/libs/utils"

import { Overlay } from "./overlay"

const VARIANTS: Variants = {
  enter: { y: 0, opacity: 1, transition: { duration: 0.1, ease: "easeOut" } },
  exit: { y: -4, opacity: 0, transition: { duration: 0.1, ease: "easeOut" } }
}

const SIZES = {
  "md": "max-w-md",
  "lg": "max-w-lg",
  "xl": "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl"
}

export function ModalComponent({
  control,
  children,
  label = "Dialog",
  placement = "top",
  size = "lg"
}: Readonly<{
  control: OverlayState
  children: React.ReactNode
  label?: string
  placement?: "top" | "center"
  size?: keyof typeof SIZES
}>) {
  return (
    <Overlay
      className={cls(
        "mx-auto h-fit w-full p-12",
        placement === "center" ? "my-auto" : "sm:my-12",
        SIZES[size]
      )}
      wrapperClassName='overflow-y-auto p-4'
      isOpen={control.isOpen}
      label={label}
      variants={VARIANTS}>
      {children}
    </Overlay>
  )
}
