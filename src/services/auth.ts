import { and, eq, getTableColumns } from 'drizzle-orm'
import { omit } from 'ramda'

import { db, schema } from '@/libs/drizzle'
import { jwt } from '@/libs/jwt'

type Wallet = Omit<typeof schema.wallets.$inferSelect, 'bio' | 'passkey'> & {
  account: Omit<typeof schema.accounts.$inferSelect, 'walletId'>
}

export async function currentWallet(token?: string): Promise<Wallet[]> {
  try {
    const { payload, error } = await jwt.verify(token || process.env.JWT_CURRENT!)
    if (error) throw new Error(error.message)

    const walletColumns = getTableColumns(schema.wallets)
    const accountColumns = getTableColumns(schema.accounts)
    return db
      .select({
        ...omit(['bio', 'passkey'], walletColumns),
        account: omit(['walletId'], accountColumns)
      })
      .from(schema.wallets)
      .innerJoin(schema.accounts, eq(schema.accounts.walletId, schema.wallets.id))
      .where(and(eq(schema.wallets.id, payload.sub), eq(schema.accounts.id, payload.uid)))
  } catch (error: any) {
    console.error('⚠️', ' An error occurred:')
    console.log(error)
    return error.message
  }
}
