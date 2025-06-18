import { accounts, addresses } from './entities/accounts.entity'
import { transactions } from './entities/transactions.entity'
import { wallets } from './entities/wallets.entity'

export const db = Object.freeze({
  accounts,
  addresses,
  wallets,
  transactions
})
