import Link from "next/link"

import { cls } from "@/libs/utils"

const PURPOSE_LABELS: Record<Purpose, string> = {
  84: "native segwit",
  86: "taproot"
}

export function AccountTabs({
  accounts,
  currentId
}: Readonly<{
  accounts: { id: string; purpose: Purpose; index: number }[]
  currentId: string
}>) {
  if (accounts.length < 2) return null

  return (
    <nav className='flex justify-center gap-2 pt-8' aria-label='Accounts'>
      {accounts.map((account) => (
        <Link
          className={cls(
            "rounded-xs px-3 py-1 text-sm capitalize transition-colors",
            account.id === currentId
              ? "bg-space-50/10 ring-space-50/20 ring-1"
              : "text-space-400 hover:text-space-100"
          )}
          key={account.id}
          href={`/${account.id}`}
          aria-current={account.id === currentId ? "page" : undefined}>
          {PURPOSE_LABELS[account.purpose]}
          {account.index > 0 && ` #${account.index}`}
        </Link>
      ))}
    </nav>
  )
}
