import { redirect } from 'next/navigation'

import { useBitcoinCore } from '@/libs/actions/rpc'

export default async function ProtectedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // __STATE's
  const isReady = await useBitcoinCore()
  if (!isReady) {
    redirect('/unknown')
  }

  // __RENDER
  return children
}
