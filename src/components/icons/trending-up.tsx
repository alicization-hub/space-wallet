import { Svg } from './svg'

export function TrendingUpIcon(props: React.SVGAttributes<SVGElement>) {
  return (
    <Svg {...props}>
      <path d='M16 7h6v6' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round' />
      <path d='m22 7-8.5 8.5-5-5L2 17' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round' />
    </Svg>
  )
}
