import { Svg } from './svg'

export function TickIcon(props: React.SVGAttributes<SVGElement>) {
  return (
    <Svg {...props}>
      <path
        d='M16.3344 2.75024H7.66537C4.64437 2.75024 2.75037 4.88924 2.75037 7.91624V16.0842C2.75037 19.1112 4.63537 21.2502 7.66537 21.2502H16.3334C19.3644 21.2502 21.2504 19.1112 21.2504 16.0842V7.91624C21.2504 4.88924 19.3644 2.75024 16.3344 2.75024Z'
        fillRule='evenodd'
        clipRule='evenodd'
        strokeWidth={1.5}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M8.43982 12.0002L10.8138 14.3732L15.5598 9.6272'
        opacity={0.4}
        strokeWidth={1.5}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </Svg>
  )
}
