"use client"

import { useSyncInterval } from "@/hooks"

import { syncNode } from "../actions/update"

/**
 * Keeps the dashboard up to date. It waits for the timer, because the page has only just read
 * everything by the time this mounts.
 */
export function NodeSync() {
  useSyncInterval(syncNode, false)

  return null
}
