"use client"

import { useCallback, useMemo, useState } from "react"

/**
 * Open state for an overlay. Every function is stable, so they are safe in dependency arrays.
 *
 * @param initialOpen - Whether it starts open
 *
 * @example
 * ```tsx
 * const modal = useOverlayState()
 * <ModalComponent control={modal}>…</ModalComponent>
 * ```
 */
export function useOverlayState(initialOpen: boolean = false) {
  const [isOpen, setIsOpen] = useState<boolean>(initialOpen)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  return useMemo(() => ({ isOpen, open, close }), [isOpen, open, close])
}

export type OverlayState = ReturnType<typeof useOverlayState>
