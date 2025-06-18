import { Driver } from '../driver'

export const accounts = new Driver<Account.Schema>('accounts')
export const addresses = new Driver<Account.Address>('addresses')
