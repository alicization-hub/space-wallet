"use client"

import { useSyncExternalStore } from "react"

import { cls } from "@/libs/utils"

const SCROLL_THRESHOLD = 50

function subscribe(handleScroll: () => void) {
  window.addEventListener("scroll", handleScroll, { passive: true })
  return () => window.removeEventListener("scroll", handleScroll)
}

/**
 * The navbar's background, on its own layer so that fading it in only animates `opacity`.
 */
export function NavbarGlass() {
  const isScrolled = useSyncExternalStore(
    subscribe,
    () => window.scrollY > SCROLL_THRESHOLD,
    () => false
  )

  return (
    <div
      className={cls(
        "mirror absolute inset-0 -z-10 backdrop-blur-lg transition-opacity duration-500",
        isScrolled ? "opacity-100" : "opacity-0"
      )}
    />
  )
}
