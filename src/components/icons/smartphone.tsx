import { Svg } from './svg'

export function SmartphoneIcon(props: React.SVGAttributes<SVGElement>) {
  return (
    <Svg {...props}>
      <rect
        width={14}
        height={20}
        x={5}
        y={2}
        rx={2}
        ry={2}
        strokeWidth={1.5}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path d='M12 18h.01' opacity={0.5} strokeWidth={2} strokeLinecap='round' strokeLinejoin='round' />
    </Svg>
  )
}
