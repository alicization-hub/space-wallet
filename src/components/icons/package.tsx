import { Svg } from './svg'

export function PackageIcon(props: React.SVGAttributes<SVGElement>) {
  return (
    <Svg {...props}>
      <path
        d='M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z'
        strokeWidth={1.5}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='m3.3 7 8.7 5 8.7-5'
        opacity={0.4}
        strokeWidth={1.5}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path d='M12 22V12' opacity={0.4} strokeWidth={1.5} strokeLinecap='round' strokeLinejoin='round' />
    </Svg>
  )
}
