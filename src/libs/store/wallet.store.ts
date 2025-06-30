import { create } from 'zustand'

import { type WebState } from '../drizzle/types'

type States = {
  wallet: Schema.iWallet
  account: Schema.iAccount
}

type Actions = {
  setWallet: (wallet: States['wallet']) => void
  setAccount: (account: States['account']) => void
}

const store = create<States & Actions>((setState, getState) => ({
  // STATE's
  wallet: {
    id: '',
    slug: '',
    name: '',
    createdAt: new Date(),
    updatedAt: null
  },
  account: {
    id: '',
    label: '',
    purpose: 84,
    balance: {
      confirmed: 0,
      unconfirmed: 0,
      immature: 0,
      total: 0,
      spendable: 0
    },
    lastSyncHeight: 0,
    startedAt: new Date(),
    createdAt: new Date(),
    updatedAt: null
  },

  // ACTION's
  setWallet: (wallet) => setState({ wallet }),
  setAccount: (account) => setState({ account })
}))

export const useWallet = store
