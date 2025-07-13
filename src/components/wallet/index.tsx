import { ReceiveComponent } from '@/components/receive'
import { SendComponent } from '@/components/send'

import { BalanceComponent } from './balance'

export function WalletComponent() {
  // __RENDER
  return (
    <section className='flex flex-col gap-4 px-8 py-16' aria-label='Wallet'>
      <BalanceComponent />

      <div className='flex items-center justify-center gap-4'>
        <SendComponent />
        <ReceiveComponent />
      </div>
    </section>
  )
}
