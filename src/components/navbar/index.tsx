import { WalletIcon } from '../icons'
import { InfoComponent } from './info'

export function NavbarComponent({}: Readonly<{}>) {
  // __RENDER
  return (
    <nav className='bg-foreground/10 ring-foreground/20 max-w-space fixed inset-x-0 z-10 mx-auto ring-1 backdrop-blur'>
      <div className='flex h-10 items-center justify-between gap-4 px-3 select-none'>
        <div className='flex items-center gap-2'>
          <WalletIcon className='size-5' />
          <span className='font-number font-semibold'>Space Wallet</span>
        </div>

        <InfoComponent />
      </div>
    </nav>
  )
}
