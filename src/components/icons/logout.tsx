import { Svg } from './svg'

export function LogoutIcon(props: React.SVGAttributes<SVGElement>) {
  return (
    <Svg {...props}>
      <path
        d='M15.016 7.38948V6.45648C15.016 4.42148 13.366 2.77148 11.331 2.77148H6.45597C4.42197 2.77148 2.77197 4.42148 2.77197 6.45648V17.5865C2.77197 19.6215 4.42197 21.2715 6.45597 21.2715H11.341C13.37 21.2715 15.016 19.6265 15.016 17.5975V16.6545'
        opacity={0.4}
        strokeWidth={1.5}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path d='M21.8094 12.0215H9.76843' strokeWidth={1.5} strokeLinecap='round' strokeLinejoin='round' />
      <path
        d='M18.8812 9.1062L21.8092 12.0212L18.8812 14.9372'
        strokeWidth={1.5}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </Svg>
  )
}
