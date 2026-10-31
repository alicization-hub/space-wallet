import { Receive } from "@/components/receive"
import { Send } from "@/components/send"
import type { PublicAccount } from "@/drizzle/types"
import { satsToBitcoin } from "@/libs/bitcoin/unit"
import { numberToSpace } from "@/libs/utils"

export function Wallet({ account }: Readonly<{ account: PublicAccount }>) {
  const { balance } = account
  const [coin, decimal] = satsToBitcoin(balance.total).toFixed(8).split(".")
  const total = `${coin}.${numberToSpace(decimal, 4).padStart(6, "0")}`
  const balances = [
    { label: "confirmed", value: balance.confirmed },
    { label: "unconfirmed", value: balance.unconfirmed },
    { label: "immature", value: balance.immature },
    { label: "spendable", value: balance.spendable }
  ]

  return (
    <section className='flex flex-col gap-4 px-8 py-16' aria-label='Wallet'>
      <div className='flex justify-center gap-4'>
        {balances.map((record, index) => (
          <div className='mirror flex items-center rounded-xs px-2' key={index}>
            <div className='text-space-200 text-xs font-light capitalize select-none'>
              {record.label}:
            </div>

            <div className='font-number ml-2'>
              <span className='font-semibold'>
                {satsToBitcoin(record.value).toFixed(8)}
              </span>
              <small className='text-space-400 pl-1 uppercase'>btc</small>
            </div>
          </div>
        ))}
      </div>

      <div className='flex flex-col gap-1 text-center'>
        <div className='font-number text-space-50 word-tighter text-6xl font-black'>
          {total}
        </div>

        <div className='font-number px-1'>
          <span className='text-space-200 word-tight text-xl'>
            {numberToSpace(balance.spendable.toString())}
          </span>
          <span className='text-space-200 pl-1.5 text-sm font-light'>sats</span>
        </div>
      </div>

      <div className='flex items-center justify-center gap-4'>
        <Send
          accountId={account.id}
          purpose={account.purpose}
          spendable={balance.spendable}
        />
        <Receive accountId={account.id} purpose={account.purpose} />
      </div>
    </section>
  )
}
