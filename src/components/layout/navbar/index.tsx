import {
  ClockSparkles,
  PackageIcon,
  RefreshCw,
  SignalSparkles
} from "@keyline-icons/react/two-tone"
import Image from "next/image"
import Link from "next/link"

import type { MenuWallet } from "@/actions/account/read"
import type { NodeInfo } from "@/actions/rpc"

import { NavbarGlass } from "./glass"
import { WalletMenu } from "./wallet-menu"

export function Navbar({
  node,
  wallets
}: Readonly<{ node: NodeInfo | null; wallets: MenuWallet[] | null }>) {
  return (
    <nav className='fixed inset-x-0 top-0 z-10'>
      <NavbarGlass />

      <div className='max-w-space mx-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-1 p-4 select-none'>
        <div className='flex items-center gap-x-4'>
          <Link className='flex items-center gap-2.5' href='/'>
            <Image
              alt='Bitcoin Icon'
              src='/static/images/bitcoin.png'
              width={22}
              height={22}
              preload
            />
            <div className='text-lg capitalize'>bitcoin wallet</div>
          </Link>

          <WalletMenu wallets={wallets} />
        </div>

        {node !== null ? (
          <div className='flex flex-wrap gap-x-6 gap-y-1'>
            <div
              className='flex items-center gap-x-2'
              title={node.isSyncing ? "Syncing" : "Synced"}>
              {node.isSyncing ? (
                <RefreshCw className='size-4 animate-spin' />
              ) : (
                <PackageIcon className='size-4' />
              )}

              <div className='text-number flex items-center gap-x-1 whitespace-nowrap'>
                <span className='text-sm font-medium'>{node.blocks}</span>
                <span className='text-xs font-light opacity-75'>
                  ({node.verification})
                </span>
              </div>
            </div>

            <div className='flex items-center gap-x-2' title='Uptime'>
              <ClockSparkles className='size-4' />
              <span className='text-number text-sm font-medium whitespace-nowrap'>
                {node.uptime}
              </span>
            </div>

            <div className='flex items-center gap-x-2' title='Connection & Latency'>
              <SignalSparkles className='size-4 -translate-y-0.5' />

              <div className='text-number flex items-center gap-x-1 whitespace-nowrap'>
                <span className='text-sm font-medium uppercase'>{node.connection}</span>
                <span className='text-xs font-light opacity-75'>({node.latency})</span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </nav>
  )
}
