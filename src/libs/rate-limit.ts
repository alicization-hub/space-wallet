type Bucket = { count: number; resetAt: number }

declare global {
  var __spaceRateLimit: Map<string, Bucket> | undefined
}

/**
 * Most keys tracked at once, so a flood of random keys can't grow memory without limit.
 */
const MAX_BUCKETS = 10_000

/**
 * On `globalThis` because Next.js can load this module more than once, and a counter per copy would
 * multiply the allowed attempts. It's per process and resets on restart, which fits a wallet that
 * runs as one server.
 */
const buckets = (globalThis.__spaceRateLimit ??= new Map<string, Bucket>())

function prune(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }

  while (buckets.size >= MAX_BUCKETS) {
    buckets.delete(buckets.keys().next().value!)
  }
}

/**
 * Counts an attempt against a key. Count before doing the expensive work, so concurrent requests
 * can't all slip through while the first one is still running.
 *
 * @param key - What is being limited, e.g. `send:<walletId>`
 * @param limit - Attempts allowed per window
 * @param windowMs - Length of the window
 * @returns `isAllowed`, and how long until the window ends
 *
 * @example
 * ```ts
 * const { isAllowed, retryAfterMs } = consume("send:my-wallet", 5, 900_000)
 * ```
 */
export function consume(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  let bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    prune(now)
    bucket = { count: 0, resetAt: now + windowMs }
    buckets.set(key, bucket)
  }

  bucket.count += 1

  return { isAllowed: bucket.count <= limit, retryAfterMs: bucket.resetAt - now }
}

/**
 * Clears a key after a successful attempt.
 */
export function reset(key: string) {
  buckets.delete(key)
}
