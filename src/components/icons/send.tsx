export function SendIcon(props: React.SVGAttributes<SVGElement>) {
  return (
    <svg
      className={props?.className}
      width={24}
      height={24}
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'>
      <path
        opacity={0.4}
        d='M15.712 7.72681L9.89099 13.5478'
        stroke='white'
        strokeWidth={1.5}
        strokeLinecap='round'
        strokeLinejoin='round'
      />

      <path
        d='M9.8912 13.548L3.0762 9.381C2.1832 8.835 2.3642 7.488 3.3702 7.197L19.4602 2.549C20.3752 2.284 21.2212 3.138 20.9472 4.05L16.1732 20.014C15.8742 21.014 14.5332 21.186 13.9912 20.294L9.8912 13.548'
        stroke='white'
        strokeWidth={1.5}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}
