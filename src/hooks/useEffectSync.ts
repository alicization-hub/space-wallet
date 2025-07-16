'use client'

import { useEffect, useRef } from 'react'

/**
 * A wrapper around the useEffect hook that allows you to run a function after a certain amount of time.
 * The function will be run with the given delay, and the effect will be cleaned up when the component is unmounted.
 *
 * If the deps array is provided, the effect will only be run if the deps change.
 * @param {Function} func - The function to be run after the delay.
 * @param {number} delay - The amount of time to wait before running the function.
 * @param {Object} [opts] - Options for the effect.
 * @param {Array} [opts.deps] - The dependencies for the effect. If provided, the effect will only be run if the deps change.
 * @param {boolean} [opts.bool] - If true, the function will be run if the deps change. If false, the function will be run every time the component is rendered.
 */
export function useEffectSync(
  func: () => Promise<void>,
  delay: number,
  opts?: {
    deps?: readonly any[]
    bool?: boolean
    interval?: number
  }
) {
  // __STATE's
  const timeoutRef = useRef<NodeJS.Timeout>(null)

  // __EFFECT's
  useEffect(() => {
    async function reCall() {
      await func()
      if (opts?.interval) {
        timeoutRef.current = setTimeout(() => reCall(), opts.interval)
      }
    }

    if (opts?.deps !== undefined) {
      if (opts?.bool) timeoutRef.current = setTimeout(reCall, delay)
    } else {
      timeoutRef.current = setTimeout(reCall, delay)
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, opts?.deps || [])

  // __RETURN
  return null
}
