import { Svg } from './svg'

export function ScanIcon(props: React.SVGAttributes<SVGElement>) {
  return (
    <Svg {...props}>
      <path d='M22.6315 13.0143H1.5' strokeWidth={1.5} strokeLinecap='round' strokeLinejoin='round' />
      <path
        d='M20.7501 8.7779V6.82514C20.7501 4.996 19.2541 3.5 17.425 3.5H15.7812'
        opacity={0.4}
        strokeWidth={1.5}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M3.38159 8.7779V6.82095C3.38159 4.98867 4.86607 3.50314 6.69835 3.50105L8.37873 3.5'
        opacity={0.4}
        strokeWidth={1.5}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M20.7501 13.0144V17.5454C20.7501 19.3735 19.2541 20.8705 17.425 20.8705H15.7812'
        strokeWidth={1.5}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M3.38159 13.0144V17.5495C3.38159 19.3818 4.86607 20.8674 6.69835 20.8695L8.37873 20.8705'
        strokeWidth={1.5}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </Svg>
  )
}
