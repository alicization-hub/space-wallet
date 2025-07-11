import { Svg } from './svg'

export function ClockIcon(props: React.SVGAttributes<SVGElement>) {
  return (
    <Svg {...props}>
      <path d='M12 6v6l4 2' opacity={0.4} strokeWidth={2} strokeLinecap='round' strokeLinejoin='round' />
      <circle cx={12} cy={12} r={10} strokeWidth={2} strokeLinecap='round' strokeLinejoin='round' />
    </Svg>
  )
}
