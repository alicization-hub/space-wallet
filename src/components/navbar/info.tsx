'use client'

import { useStore } from '@/hooks'

export function InfoComponent({}: Readonly<{}>) {
  // __STATE's
  const node = useStore((state) => state.node)

  // __RENDER
  return (
    <div className='flex gap-4'>
      <div className='flex items-center gap-1'>
        <span className='text-xs font-light capitalize opacity-75'>block height:</span>
        {node.blocks ? (
          <span className='text-number text-sm font-medium'>{node.blocks}</span>
        ) : (
          <div className='bg-foreground/15 h-5 w-12 animate-pulse' />
        )}
      </div>

      <div className='flex items-center gap-1'>
        <span className='text-xs font-light capitalize opacity-75'>connection:</span>
        {node.network ? (
          <span className='text-number text-sm font-medium'>{node.network}</span>
        ) : (
          <div className='bg-foreground/15 h-5 w-24 animate-pulse' />
        )}
      </div>
    </div>
  )
}
