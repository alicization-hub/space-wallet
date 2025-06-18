declare type UUID = `${string}-${string}-${string}-${string}-${string}`
declare type CountdownDuration = Record<
  'years' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds',
  number
>

declare type JwtPayload = {
  /** nano-id */
  id?: string
  /** wallet-id */
  sub: UUID
  iss: string
  iat: number
  exp: number
}

declare type UseDisclosureReturn = {
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  onOpenChange: () => void
  isControlled: boolean
  getButtonProps: (props?: any) => any
  getDisclosureProps: (props?: any) => any
}
