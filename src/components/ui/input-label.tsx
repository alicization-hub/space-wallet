import { cls } from '@/libs/utils'

export function LabelComponent({
  title,
  description,
  required
}: Readonly<{
  title: string
  description: string
  required?: boolean
}>) {
  // __RENDER
  return (
    <div className='flex flex-col'>
      <div className={cls('font-medium capitalize', { 'is-required': required })}>{title}</div>
      <div className='text-space-600 text-xs'>{description}</div>
    </div>
  )
}
