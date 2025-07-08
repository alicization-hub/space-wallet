import Image from 'next/image'

import { InfoComponent } from './info'

export function NavbarComponent({}: Readonly<{}>) {
  // __RENDER
  return (
    <nav className='max-w-space fixed inset-x-0 z-10 mx-auto'>
      <div className='flex items-center justify-between gap-4 px-4 select-none'>
        <div className='flex items-center gap-2.5'>
          <Image
            alt='Bitcoin Icon'
            src='/static/images/bitcoin.png'
            width={22}
            height={22}
            quality={100}
            priority
          />
          <div className='text-lg capitalize'>bitcoin wallet</div>
        </div>

        <InfoComponent />
      </div>
    </nav>
  )
}
