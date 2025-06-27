import { TransactionComponent } from '@/components/transaction'
import { WalletComponent } from '@/components/wallet'
import { paramValidator } from '@/libs/validator.zod'

export default async function IndexPage({ params }: Readonly<{ params: Promise<{ uuid: string }> }>) {
  // __STATE's
  const { uuid } = await params
  paramValidator.parse({ uuid })

  // __RENDER
  return (
    <div className='flex flex-col gap-4'>
      <WalletComponent />
      <TransactionComponent />
    </div>
  )
}
