import { Svg } from './svg'

export function CircleCheckIcon(props: React.SVGAttributes<SVGElement>) {
  return (
    <Svg {...props}>
      <path
        d='M21.801 10A10 10 0 1 1 17 3.335'
        strokeWidth={1.5}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path d='m9 11 3 3L22 4' opacity={0.4} strokeWidth={1.5} strokeLinecap='round' strokeLinejoin='round' />
    </Svg>
  )
}
