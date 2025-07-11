import { ReceiveComponent } from '@/components/receive'
import { SendComponent } from '@/components/send'
import { currentAccount } from '@/libs/actions/wallet'

import { BalanceComponent } from './balance'

export async function WalletComponent() {
  // __STATE's
  const result = await currentAccount()

  // __RENDER
  return (
    <section className='flex flex-col gap-4 px-8 py-16' aria-label='Wallet'>
      <BalanceComponent data={result} />

      <div className='flex items-center justify-center gap-4'>
        <SendComponent />
        <ReceiveComponent />
      </div>
    </section>
  )
}
