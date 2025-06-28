import { cls } from '@/libs/utils'

export function Svg({
  children,
  fill = 'none',
  viewBox = '0 0 24 24',
  width = 24,
  height = 24,
  ...rest
}: React.SVGAttributes<SVGElement>) {
  // __RENDER
  return (
    <svg
      className={cls('stroke-white', rest.className)}
      width={width}
      height={height}
      fill={fill}
      viewBox={viewBox}
      xmlns='http://www.w3.org/2000/svg'>
      {children}
    </svg>
  )
}
