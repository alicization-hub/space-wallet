import { TransactionComponent } from '@/components/transaction'
import { WalletComponent } from '@/components/wallet'
import { findAccount } from '@/libs/actions/account'
import { paramValidator } from '@/libs/validator.zod'

export default async function IndexPage({ params }: Readonly<{ params: Promise<{ uuid: string }> }>) {
  try {
    const { uuid } = await paramValidator.parseAsync(params)
    const { wallet, balances, ...account } = await findAccount(uuid)

    return (
      <div className='flex flex-col gap-4'>
        <WalletComponent wallet={wallet} account={account} defaultBalance={balances} />
        <TransactionComponent />
      </div>
    )
  } catch (error) {
    throw error
  }
}
