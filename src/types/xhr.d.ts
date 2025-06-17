declare type IResponse<D = any> = {
  statusCode: number
  message: string
  error?: any
  data?: D
}

declare type IPagination<T = any> = {
  data: T[]
  count: number
  currentPage: number
  nextPage: number | null
  prevPage: number | null
  lastPage: number
}

declare type NextParams<T = Record<string, string>> = Readonly<{
  params: Promise<T>
}>
