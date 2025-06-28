import { getWallet } from '@/libs/actions/wallet'

import { ButtonReceive, ButtonSend } from './actions'
import { BalanceComponent } from './balance'

export async function WalletComponent() {
  // __STATE's
  const [wallet] = await getWallet()

  // __RENDER
  return (
    <section className='flex flex-col gap-4 px-8 py-16' aria-label='Wallet'>
      <BalanceComponent balance={wallet.account.balance} />
      <div className='flex items-center justify-center gap-4'>
        <ButtonSend />
        <ButtonReceive />
      </div>
    </section>
  )
}
