import { Svg } from './svg'

export function ActivityIcon(props: React.SVGAttributes<SVGElement>) {
  return (
    <Svg {...props}>
      <path
        d='M7.24487 14.7815L10.238 10.8914L13.6522 13.5733L16.5813 9.79297'
        opacity={0.4}
        strokeWidth={1.5}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <circle
        cx={19.9954}
        cy={4.20027}
        r={1.9222}
        strokeWidth={1.5}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M14.9245 3.12012H7.65679C4.64535 3.12012 2.77808 5.25284 2.77808 8.26428V16.3467C2.77808 19.3581 4.60874 21.4817 7.65679 21.4817H16.2609C19.2724 21.4817 21.1396 19.3581 21.1396 16.3467V9.30776'
        strokeWidth={1.5}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </Svg>
  )
}
