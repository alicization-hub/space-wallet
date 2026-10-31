import { connection } from "next/server"

import { readNodeStatus } from "@/actions/rpc"
import { NodeWarning } from "@/components/node-warning"

/**
 * The page stays mounted behind the warning, only hidden: one failed check must not throw away a
 * half-filled send form, and the page's own sync is what notices that the node is back.
 */
export default async function WalletLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  await connection()

  const isSynced = await readNodeStatus()

  return (
    <>
      <div hidden={!isSynced}>{children}</div>

      {!isSynced && (
        <NodeWarning>
          <p className='text-foreground/50 font-normal'>
            or The process is still in syncing. Balance data may be incomplete.
          </p>
        </NodeWarning>
      )}
    </>
  )
}
