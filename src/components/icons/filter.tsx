import { Svg } from './svg'

export function FilterIcon(props: React.SVGAttributes<SVGElement>) {
  return (
    <Svg {...props}>
      <path d='M11 17.5H4' opacity={0.4} strokeWidth={1.5} strokeLinecap='round' strokeLinejoin='round' />
      <path
        d='M20 17.5C20 18.8807 18.8807 20 17.5 20C16.1193 20 15 18.8807 15 17.5C15 16.1183 16.1193 15 17.5 15C18.8807 15 20 16.1183 20 17.5Z'
        fillRule='evenodd'
        clipRule='evenodd'
        strokeWidth={1.5}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path d='M13 6.5H20' opacity={0.4} strokeWidth={1.5} strokeLinecap='round' strokeLinejoin='round' />
      <path
        d='M4 6.5C4 7.88174 5.11928 9 6.5 9C7.88072 9 9 7.88174 9 6.5C9 5.11928 7.88072 4 6.5 4C5.11928 4 4 5.11928 4 6.5Z'
        fillRule='evenodd'
        clipRule='evenodd'
        strokeWidth={1.5}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </Svg>
  )
}
