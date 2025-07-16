import { Svg } from './svg'

export function GlobeIcon(props: React.SVGAttributes<SVGElement>) {
  return (
    <Svg {...props}>
      <circle cx={12} cy={12} r={10} strokeWidth={1.5} strokeLinecap='round' strokeLinejoin='round' />
      <path
        d='M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20'
        opacity={0.4}
        strokeWidth={1.5}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path d='M2 12h20' opacity={0.4} strokeWidth={1.5} strokeLinecap='round' strokeLinejoin='round' />
    </Svg>
  )
}
