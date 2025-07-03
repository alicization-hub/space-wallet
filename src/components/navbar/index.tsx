import { InfoComponent } from './info'
import { MainComponent } from './main'

export function NavbarComponent({}: Readonly<{}>) {
  // __RENDER
  return (
    <nav className='bg-background/90 max-w-space fixed inset-x-0 z-10 mx-auto rounded-xs shadow-xl backdrop-blur-xl'>
      <div className='flex h-10 items-center justify-between gap-4 px-3 select-none'>
        <MainComponent />
        <InfoComponent />
      </div>
    </nav>
  )
}
