import { millisecondsToMinutes, minutesToMilliseconds } from "date-fns"

import { verifyPassword } from "@/libs/password"
import { consume, reset } from "@/libs/rate-limit"

const WINDOW = minutesToMilliseconds(15)
const MAX_ATTEMPTS = 5

export type PassphraseCheck =
  { status: "ok" } | { status: "invalid" } | { status: "locked"; message: string }

/**
 * Checks a passphrase before signing, under a rate limit. There's no sign-in in front of this, so the
 * limit is what stops anything that can reach the app from guessing. Attempts count before the work
 * is done and only a success clears them, so concurrent guesses can't slip through.
 *
 * @param walletId - The wallet being sent from
 * @param passkey - The stored hash
 * @param passphrase - The passphrase that was typed
 */
export async function checkSend(
  walletId: string,
  passkey: string,
  passphrase: string
): Promise<PassphraseCheck> {
  const key = `send:${walletId}`

  const attempt = consume(key, MAX_ATTEMPTS, WINDOW)
  if (!attempt.isAllowed) {
    const minutes = Math.max(millisecondsToMinutes(attempt.retryAfterMs), 1)
    return {
      status: "locked",
      message: `Too many attempts. Try again in ${minutes} minutes.`
    }
  }

  if (!(await verifyPassword(passphrase, passkey))) return { status: "invalid" }

  reset(key)
  return { status: "ok" }
}
