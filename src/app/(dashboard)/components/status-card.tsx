import { cls } from "@/libs/utils"

import { NO_VALUE } from "../utils"

/**
 * A short list of things that are on or off, named in words so the colour isn't the only signal.
 *
 * @param rows - Null when the node couldn't say
 */
export function StatusCard({
  label,
  rows
}: Readonly<{
  label: string
  rows: { name: string; value: string; isOn: boolean }[] | null
}>) {
  return (
    <div className='mirror flex min-w-0 flex-col gap-2 rounded-xs p-4'>
      <div className='text-space-200 text-xs font-light capitalize select-none'>
        {label}
      </div>

      <div className='font-number flex flex-col gap-1 text-sm'>
        {rows
          ? rows.map(({ name, value, isOn }) => (
              <div className='flex items-center justify-between gap-2' key={name}>
                <span className='text-space-400'>{name}</span>
                <span className={cls("font-semibold", isOn && "text-green-300")}>
                  {value}
                </span>
              </div>
            ))
          : NO_VALUE}
      </div>
    </div>
  )
}
