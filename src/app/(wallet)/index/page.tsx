import { redirect } from "next/navigation"
import { connection } from "next/server"

import { readFirstAccount } from "@/actions/account/read"

export const instant = false

/**
 * The way into the wallets from the dashboard: opens the oldest one, or says there is none yet.
 * Wallets are created, imported and recovered from the terminal (`tests/wallet.spec.ts`): the mnemonic
 * and the seed never pass through a browser.
 */
export default async function Index() {
  await connection()

  const account = await readFirstAccount()
  if (account) redirect(`/${account.id}`)

  return (
    <div className='mx-auto flex max-w-md flex-col gap-8 py-24'>
      <div className='text-foreground-400 flex flex-col gap-1 text-center text-sm font-light'>
        <span>No wallet yet. Create or recover one from the server terminal:</span>
        <code className='font-number'>bun tests/wallet.spec.ts</code>
      </div>
    </div>
  )
}
