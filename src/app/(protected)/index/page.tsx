import { CreateWalletComponent } from './components/create-wallet'
import { ConnectHardwareComponent } from './components/hardware-wallet'
import { ImportWalletComponent } from './components/import-wallet'
import { RecoverWalletComponent } from './components/recover-wallet'

export default function IndexPage() {
  // __RENDER
  return (
    <div className='mx-auto flex max-w-xl flex-col gap-8 py-24'>
      <CreateWalletComponent />

      <div className='flex justify-around gap-6'>
        <ConnectHardwareComponent />
        <ImportWalletComponent />
        <RecoverWalletComponent />
      </div>

      <div className='text-foreground-300 text-center text-sm font-light'>
        Lorem ipsum dolor sit, amet consectetur adipisicing elit. Possimus corrupti saepe perspiciatis aliquam
        natus dolore ab, iste quod quis delectus soluta quos minima itaque tenetur deserunt in animi autem
        fugiat!
      </div>
    </div>
  )
}
