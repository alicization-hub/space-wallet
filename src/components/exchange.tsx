import { numberToSpace } from '@/libs/utils'

export function ExchangeComponent({}: Readonly<{}>) {
  // __RENDER
  return (
    <div className='bg-foreground/5 ring-foreground/10 flex flex-col gap-0.5 rounded-xs px-6 py-4 ring-1 backdrop-blur'>
      <div className='pb-1.5 text-sm font-medium uppercase select-none'>exchange rate</div>

      <div className='flex items-center justify-center gap-4'>
        <div className='font-number'>
          <span className='word-tight text-lg font-medium'>{numberToSpace('100000')}</span>
          <small className='text-foreground/70 pl-1 uppercase'>usd</small>
        </div>
      </div>

      <div className='flex items-center justify-center gap-4'>
        <div className='font-number'>
          <span className='word-tight text-lg font-medium'>{numberToSpace('3000000')}</span>
          <small className='text-foreground/70 pl-1 uppercase'>thb</small>
        </div>
      </div>
    </div>
  )
}
