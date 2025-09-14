import { FolderIcon } from '../icons'

export function EmptyComponent() {
  // __RENDER
  return (
    <div className='flex flex-col items-center justify-center gap-2 py-20'>
      <FolderIcon className='size-10 opacity-20' />
      <div className='text-space-500 font-number text-lg font-light select-none'>No transaction's found.</div>
    </div>
  )
}
