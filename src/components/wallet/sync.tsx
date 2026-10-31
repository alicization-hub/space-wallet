"use client"

import { useCallback } from "react"

import { syncAccount } from "@/actions/account/update"
import { useSyncInterval } from "@/hooks"

/**
 * Keeps the account page up to date. The first call goes out as the page opens, because the sync is
 * also what copies the node's balance to the database.
 */
export function AccountSync({ accountId }: Readonly<{ accountId: string }>) {
  const handleSync = useCallback(() => syncAccount(accountId), [accountId])

  useSyncInterval(handleSync)

  return null
}
