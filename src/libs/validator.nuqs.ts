import { createSearchParamsCache, parseAsInteger, parseAsString, parseAsStringEnum } from 'nuqs/server'

export const searchValidator = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  take: parseAsInteger.withDefault(10),
  status: parseAsStringEnum(['all', 'active', 'inactive']).withDefault('all'),
  search: parseAsString
})

export type SearchValidator = ReturnType<typeof searchValidator.parse>
