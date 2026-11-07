"use client"

import {
  BracketLeft,
  BracketRight,
  MenuSparklesIcon,
  WalletIcon,
  WalletSparklesIcon
} from "@keyline-icons/react/two-tone"
import { usePathname, useSearchParams } from "next/navigation"
import { useMemo } from "react"

import type { MenuWallet } from "@/actions/account/read"
import { Menu, MenuEmpty, MenuGroup, MenuItem, MenuSubGroup } from "@/components/ui/menu"
import { satsToBitcoin } from "@/libs/bitcoin/unit"

const PURPOSE_LABELS: Record<Purpose, string> = {
  84: "native segwit",
  86: "taproot"
}

/**
 * The navbar's way between wallets and accounts. On an account page its button reads as a powerline
 * prompt, the way oh-my-posh's paradox theme draws one: icon, wallet, account.
 *
 * The open account comes from the URL rather than from the page, because the navbar lives in the root
 * layout, which never sees the page's search params.
 */
export function WalletMenu({ wallets }: Readonly<{ wallets: MenuWallet[] | null }>) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const accountId = pathname === "/account" ? searchParams.get("vid") : null

  const current = useMemo(() => {
    if (!accountId || !wallets) return null

    for (const wallet of wallets) {
      const account = wallet.accounts.find((account) => account.id === accountId)
      if (account) return { wallet, account }
    }

    return null
  }, [accountId, wallets])

  return (
    <Menu
      label='Wallets and accounts'
      triggerClassName={current ? "h-7" : "size-7"}
      trigger={
        current ? (
          <span className='text-posh-ink flex h-full items-stretch text-sm font-medium'>
            <span className='powerline bg-white'>
              <WalletSparklesIcon className='size-4' />
            </span>
            <span className='powerline bg-white/75'>
              <span className='max-w-40 truncate'>{current.wallet.name}</span>
            </span>
            <span className='powerline bg-white/50'>
              <span className='max-w-40 truncate'>{current.account.label}</span>
            </span>
          </span>
        ) : (
          <>
            <MenuSparklesIcon className='size-5' />
          </>
        )
      }>
      <MenuGroup label='Wallets'>
        {wallets === null ? (
          <MenuEmpty>The database can&apos;t be read right now.</MenuEmpty>
        ) : wallets.length === 0 ? (
          <MenuEmpty>
            No wallet yet. Create one from the server terminal:{" "}
            <code className='font-number'>bun tests/wallet.spec.ts</code>
          </MenuEmpty>
        ) : (
          wallets.map((wallet) => (
            <MenuSubGroup
              key={wallet.id}
              icon={<WalletIcon className='size-4' />}
              label={wallet.name}
              isCurrent={wallet.id === current?.wallet.id}>
              {wallet.accounts.map((account) => (
                <MenuItem
                  key={account.id}
                  href={`/account?vid=${account.id}`}
                  prefetch={false}
                  isActive={account.id === current?.account.id}>
                  <div className='text-sm'>{account.label}</div>

                  <div className='flex items-center gap-x-0.5'>
                    <BracketLeft className='size-3' />
                    <span className='text-foreground-500 text-[0.6875rem] whitespace-nowrap capitalize'>
                      {PURPOSE_LABELS[account.purpose]}
                    </span>

                    <span className='px-1 text-[10px]'>/</span>

                    <span className='text-number text-foreground-500 text-xs'>
                      {satsToBitcoin(account.total).toFixed(8)}
                      <span className='pl-1 uppercase'>btc</span>
                    </span>
                    <BracketRight className='size-3' />
                  </div>
                </MenuItem>
              ))}
            </MenuSubGroup>
          ))
        )}
      </MenuGroup>
    </Menu>
  )
}
