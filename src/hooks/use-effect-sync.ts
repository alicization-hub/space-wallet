"use client"

import { useEffect, useRef } from "react"

/**
 * A wrapper around the useEffect hook that allows you to run a function after a certain amount of time.
 * The function will be run with the given delay, and the effect will be cleaned up when the component is unmounted.
 *
 * @param {Function} func - The function to be run after the delay.
 * @param {number} delay - The amount of time to wait before running the function.
 * @param {Array} [deps] - The dependencies for the effect. The function runs again when they change.
 */
export function useEffectSync(
  func: () => void,
  delay: number,
  deps: readonly any[] = []
) {
  const timeoutRef = useRef<NodeJS.Timeout>(null)

  useEffect(() => {
    timeoutRef.current = setTimeout(func, delay)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, deps)

  return null
}
