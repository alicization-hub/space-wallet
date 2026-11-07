import { createSearchParamsCache, parseAsString } from "nuqs/server"

/**
 * `vid` is an `accounts.id`. It's parsed as a plain string, because `readAccount` is what decides
 * whether it's a UUID of an account that can be opened.
 */
export const queryValidator = createSearchParamsCache({
  vid: parseAsString.withDefault("")
})

export type QueryValidator = ReturnType<typeof queryValidator.parse>
