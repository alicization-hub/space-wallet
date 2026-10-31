"use client"

import { secondsToMilliseconds } from "date-fns"
import { unstable_isUnrecognizedActionError } from "next/navigation"
import { useEffect } from "react"

const SYNC_INTERVAL = secondsToMilliseconds(15)

/**
 * Keeps the page that uses it up to date. `sync` calls a Server Action that answers with the page
 * rendered fresh, so new data arrives as props from the Server Components, and an open overlay keeps
 * its state.
 *
 * It only runs while the tab is visible, and catches up as soon as the tab is back. It isn't in a
 * transition on purpose: a request that fails here is a missed tick for the next one to make up, not
 * a reason to replace the page with the error page.
 *
 * @param sync - The action to call. Must be stable, or the timer restarts on every render
 * @param isImmediate - Whether to call it as the page opens as well, instead of waiting for the timer
 */
export function useSyncInterval(
  sync: () => Promise<unknown>,
  isImmediate: boolean = true
) {
  useEffect(() => {
    let isSyncing = false

    async function handleSync() {
      if (isSyncing || document.visibilityState !== "visible") return

      isSyncing = true
      await sync()
        .catch((error) => {
          // A new build changes the action IDs, so this tab runs old code and only a reload can fix
          // that. It would otherwise stop updating without a word.
          if (!unstable_isUnrecognizedActionError(error)) throw error
          location.reload()
        })
        .finally(() => {
          isSyncing = false
        })
    }

    if (isImmediate) handleSync()

    const interval = setInterval(handleSync, SYNC_INTERVAL)
    document.addEventListener("visibilitychange", handleSync)

    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", handleSync)
    }
  }, [sync, isImmediate])
}
