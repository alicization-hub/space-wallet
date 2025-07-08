'use client'

import { ActivityIcon, ChartIcon } from '@/components/icons'
import { useStore } from '@/hooks'

import { AccountComponent } from './account'

export function InfoComponent({}: Readonly<{}>) {
  // __STATE's
  const node = useStore((state) => state.node)

  // __RENDER
  return (
    <div className='flex gap-4'>
      <AccountComponent />

      <div className='flex items-center gap-2 px-2' title='Current blocks'>
        <ActivityIcon className='size-5' />
        {node.blocks ? (
          <span className='text-number text-sm font-medium'>{node.blocks}</span>
        ) : (
          <div className='bg-foreground/5 h-5 w-12 animate-pulse' />
        )}
      </div>

      <div className='flex items-center gap-2 px-2' title='Connection'>
        <ChartIcon className='size-5' />
        {node.network ? (
          <span className='text-number text-sm font-medium'>{node.network}</span>
        ) : (
          <div className='bg-foreground/5 h-5 w-24 animate-pulse' />
        )}
      </div>
    </div>
  )
}
