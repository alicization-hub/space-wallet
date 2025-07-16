import { Svg } from './svg'

export function RefreshCwIcon(props: React.SVGAttributes<SVGElement>) {
  return (
    <Svg {...props}>
      <path
        d='M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8'
        opacity={0.4}
        strokeWidth={1.5}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path d='M21 3v5h-5' strokeWidth={1.5} strokeLinecap='round' strokeLinejoin='round' />
      <path
        d='M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16'
        opacity={0.4}
        strokeWidth={1.5}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path d='M8 16H3v5' strokeWidth={1.5} strokeLinecap='round' strokeLinejoin='round' />
    </Svg>
  )
}
