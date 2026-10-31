"use server"

import { refresh } from "next/cache"

/**
 * Sends the dashboard back rendered fresh, which is how an open page updates (`NodeSync`). The page's
 * own render does the reading, so this takes nothing and returns nothing.
 */
export async function syncNode() {
  refresh()
}
