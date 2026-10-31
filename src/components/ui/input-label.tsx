import { cls } from "@/libs/utils"

export function InputLabel({
  title,
  description,
  isRequired
}: Readonly<{
  title: string
  description: string
  isRequired?: boolean
}>) {
  return (
    <div className='flex flex-col'>
      <div className={cls("font-medium capitalize", { "is-required": isRequired })}>
        {title}
      </div>
      <div className='text-space-600 text-xs'>{description}</div>
    </div>
  )
}
