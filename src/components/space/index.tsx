'use client'

import dynamic from 'next/dynamic'

const TwinklingStars = dynamic(() => import('./stars'), { ssr: false })

export function SpaceComponent() {
  // __RENDER
  return (
    <div className='pointer-events-none fixed inset-0 overflow-hidden select-none'>
      <svg
        className='size-full opacity-60 blur-xl'
        viewBox='0 0 2040 1820'
        fill='none'
        preserveAspectRatio='xMidYMid slice'>
        <g className='translate-y-[calc(100dvw/20)]' filter='url(#filter-A)'>
          <circle cx={920} cy={0} r={500} fillOpacity={0.75} fill='#FF6308' />
        </g>

        <g className='translate-y-[calc(100dvw/20)]' filter='url(#filter-B)'>
          <circle cx={1000} cy={0} r={500} fillOpacity={0.75} fill='#BDC9E6' />
        </g>

        <g className='translate-y-[calc(100dvw/20)]' filter='url(#filter-C)'>
          <circle cx={1080} cy={0} r={500} fillOpacity={0.91} fill='#97C4FF' />
        </g>

        <defs>
          <filter
            id='filter-A'
            x={0.445953}
            y={0.445953}
            width={1819.11}
            height={1819.11}
            filterUnits='userSpaceOnUse'
            colorInterpolationFilters='sRGB'>
            <feFlood floodOpacity={0} result='BackgroundImageFix' />
            <feBlend mode='normal' in='SourceGraphic' in2='BackgroundImageFix' result='shape' />
            <feGaussianBlur stdDeviation={198.777} />
          </filter>

          <filter
            id='filter-B'
            x={112.446}
            y={0.445953}
            width={1819.11}
            height={1819.11}
            filterUnits='userSpaceOnUse'
            colorInterpolationFilters='sRGB'>
            <feFlood floodOpacity={0} result='BackgroundImageFix' />
            <feBlend mode='normal' in='SourceGraphic' in2='BackgroundImageFix' result='shape' />
            <feGaussianBlur stdDeviation={198.777} />
          </filter>

          <filter
            id='filter-C'
            x={224.446}
            y={0.445953}
            width={1819.11}
            height={1819.11}
            filterUnits='userSpaceOnUse'
            colorInterpolationFilters='sRGB'>
            <feFlood floodOpacity={0} result='BackgroundImageFix' />
            <feBlend mode='normal' in='SourceGraphic' in2='BackgroundImageFix' result='shape' />
            <feGaussianBlur stdDeviation={198.777} />
          </filter>
        </defs>
      </svg>

      <TwinklingStars />
    </div>
  )
}
