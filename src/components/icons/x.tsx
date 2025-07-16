import { Svg } from './svg'

export function XIcon(props: React.SVGAttributes<SVGElement>) {
  return (
    <Svg {...props}>
      <path d='M18 6 6 18' strokeLinecap='round' strokeLinejoin='round' />
      <path d='m6 6 12 12' strokeLinecap='round' strokeLinejoin='round' />
    </Svg>
  )
}
