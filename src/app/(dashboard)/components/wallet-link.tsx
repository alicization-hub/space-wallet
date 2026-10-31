import { WalletIcon } from "@keyline-icons/react"
import Link from "next/link"

/**
 * The way into the wallets from here, so the page renders it with or without an answer from the node.
 * `/index` reads the database to pick the wallet, which the prefetch would do on every render.
 */
export function WalletLink() {
  return (
    <Link
      className='hover:bg-space-50/5 hover:ring-space-50/10 flex h-10 items-center justify-center gap-2 rounded-xs px-4 hover:ring-1'
      href='/index'
      prefetch={false}>
      <WalletIcon className='size-5' />
      <span className='text-sm font-semibold uppercase'>open wallet</span>
    </Link>
  )
}
