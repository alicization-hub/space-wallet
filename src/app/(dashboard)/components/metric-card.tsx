import { cls } from "@/libs/utils"

/**
 * A number with its label, on the surface of a transaction row.
 */
export function MetricCard({
  label,
  value,
  unit,
  caption,
  valueClassName
}: Readonly<{
  label: string
  value: React.ReactNode
  unit?: string
  caption?: React.ReactNode
  valueClassName?: string
}>) {
  return (
    <div className='mirror flex min-w-0 flex-col justify-between gap-2 rounded-xs p-4'>
      <div className='text-space-200 text-xs font-light capitalize select-none'>
        {label}
      </div>

      <div className='font-number'>
        <span className={cls("word-tight text-2xl font-bold", valueClassName)}>
          {value}
        </span>
        {unit && <small className='text-space-400 pl-1 uppercase'>{unit}</small>}
      </div>

      {caption && <div className='text-space-400 text-xs'>{caption}</div>}
    </div>
  )
}
