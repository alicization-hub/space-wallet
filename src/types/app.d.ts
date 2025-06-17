declare module 'electrum-client'

declare type JwtPayload = {
  id: number
  uid: string
  role: Tiers
}

declare type CountdownDuration = Record<
  'years' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds',
  number
>

declare type IterableState = 'all' | Iterable<string | number>

declare type UseDisclosureReturn = {
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  onOpenChange: () => void
  isControlled: boolean
  getButtonProps: (props?: any) => any
  getDisclosureProps: (props?: any) => any
}
