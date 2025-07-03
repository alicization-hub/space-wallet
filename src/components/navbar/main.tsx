'use client'

import { WalletIcon } from '@/components/icons'
import { useWallet } from '@/hooks'

export function MainComponent({}: Readonly<{}>) {
  // __STATE's
  const wallet = useWallet((state) => state.wallet)

  // __RENDER
  return (
    <div className='flex items-center gap-2'>
      <WalletIcon className='size-5' />
      {wallet.id ? (
        <div className='font-number text-base font-medium capitalize'>{wallet.name}</div>
      ) : (
        <div className='bg-foreground/5 h-5 w-32 animate-pulse' />
      )}
    </div>
  )
}
