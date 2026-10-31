"use client"

import type { Variants } from "framer-motion"

import type { OverlayState } from "@/hooks"
import { cls } from "@/libs/utils"

import { Overlay } from "./overlay"

const VARIANTS: Variants = {
  enter: { x: 0, opacity: 1, transition: { duration: 0.2, ease: "easeOut" } },
  exit: { x: 4, opacity: 0, transition: { duration: 0.1, ease: "easeOut" } }
}

const SIZES = {
  "md": "max-w-md",
  "lg": "max-w-lg",
  "xl": "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl"
}

export function DrawerComponent({
  control,
  children,
  label = "Drawer",
  size = "lg"
}: Readonly<{
  control: OverlayState
  children: React.ReactNode
  label?: string
  size?: keyof typeof SIZES
}>) {
  return (
    <Overlay
      className={cls("ml-auto flex h-full w-full flex-col overflow-hidden", SIZES[size])}
      wrapperClassName='p-4'
      isOpen={control.isOpen}
      label={label}
      variants={VARIANTS}>
      {children}
    </Overlay>
  )
}

export function DrawerHeader({
  children,
  className
}: Readonly<{ children: React.ReactNode; className?: string }>) {
  return (
    <header className={cls("flex flex-initial flex-col", className)}>{children}</header>
  )
}

export function DrawerBody({
  children,
  className
}: Readonly<{ children: React.ReactNode; className?: string }>) {
  return (
    <div className={cls("flex flex-1 flex-col overflow-y-auto", className)}>
      {children}
    </div>
  )
}

export function DrawerFooter({
  children,
  className
}: Readonly<{ children: React.ReactNode; className?: string }>) {
  return <footer className={cls("flex flex-initial", className)}>{children}</footer>
}
