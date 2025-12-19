import { DangerIcon } from '@/components/icons'
import { NavbarComponent } from '@/components/navbar'
import { getNode } from '@/libs/actions/rpc'

export default async function ProtectedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // __STATE's
  const isSynced = await getNode()

  // __RENDER
  return (
    <main className='app-wrapper min-h-svh'>
      <NavbarComponent />
      <div className='app-router max-w-space mx-auto'>
        {isSynced ? (
          children
        ) : (
          <div className='flex flex-col items-center justify-center py-32'>
            <DangerIcon className='size-32' />
            <h3 className='text-foreground/90 text-4xl font-bold uppercase'>warning</h3>
            <p className='text-foreground/75 text-2xl leading-10 font-light'>
              <b>Bitcoin Core RPC</b> is currently offline.
            </p>
            <p className='text-foreground/50 font-normal'>
              or The process is still in syncing. Balance data may be incomplete.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
