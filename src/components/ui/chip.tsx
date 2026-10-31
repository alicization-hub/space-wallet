import { cls } from "@/libs/utils"

const COLORS = {
  success: "bg-green-500/20 text-green-400",
  danger: "bg-rose-500/20 text-rose-400",
  secondary: "bg-violet-500/20 text-violet-300"
}

export function Chip({
  children,
  className,
  color
}: Readonly<{
  children: React.ReactNode
  className?: string
  color: keyof typeof COLORS
}>) {
  return (
    <span
      className={cls(
        "inline-flex h-6 items-center rounded-full px-2 text-xs capitalize",
        COLORS[color],
        className
      )}>
      {children}
    </span>
  )
}
