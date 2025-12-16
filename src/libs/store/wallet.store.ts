import { create } from 'zustand'

import { type Schema } from '../drizzle/types'

type States = {
  wallet: Schema.IWallet
  account: Schema.IAccount
  balance: Schema.IBalance
}

type Actions = {
  setWallet: (wallet: States['wallet']) => void
  setAccount: (account: States['account']) => void
  setBalance: (balance: States['balance']) => void
}

const store = create<States & Actions>((setState) => ({
  // STATE's
  wallet: {
    id: '',
    slug: '',
    name: '',
    isActive: true,
    createdAt: new Date(),
    updatedAt: null
  },
  account: {
    id: '',
    label: '',
    index: 0,
    purpose: 84,
    isActive: true,
    startedAt: new Date(),
    createdAt: new Date(),
    updatedAt: null
  },
  balance: {
    id: '',
    confirmed: 0,
    unconfirmed: 0,
    immature: 0,
    total: 0,
    spendable: 0,
    createdAt: new Date(),
    updatedAt: null
  },

  // ACTION's
  setWallet: (wallet) => setState({ wallet }),
  setAccount: (account) => setState({ account }),
  setBalance: (balance) => setState({ balance })
}))

export const useWallet = store
