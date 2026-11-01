declare type Purpose = 84 | 86
declare type MnemonicLength = 12 | 24

declare type Fee = {
  label: string
  duration: string
  value: number
}

declare type CountdownDuration = Record<
  "years" | "months" | "weeks" | "days" | "hours" | "minutes" | "seconds",
  number
>

/**
 * One page of a list. Page numbers start at 1; `nextPage` / `prevPage` are `null` at either end, and
 * `lastPage` is at least 1 so an empty list still has one (empty) page.
 */
declare type Pagination<T = unknown> = {
  data: T[]
  count: number
  take: number
  currentPage: number
  nextPage: number | null
  prevPage: number | null
  lastPage: number
}

declare type NextParams<T = Record<string, string>> = Readonly<{
  params: Promise<T>
}>

declare type NextSearchParams<T = Record<string, string | string[] | undefined>> =
  Readonly<{
    searchParams: Promise<T>
  }>
