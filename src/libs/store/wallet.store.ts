import { create } from 'zustand'

type States = {
  wallet?: WebState.Wallet
  account?: WebState.Account
  addresses?: WebState.Address[]
  otxos?: WebState.UTXO[]
}

type Actions = {
  setWallet: (wallet: States['wallet']) => void
  setAccount: (account: States['account']) => void
  setAddresses: (addresses: States['addresses']) => void
  setUTXOs: (utxos: States['otxos']) => void
}

const store = create<States & Actions>((setState, getState) => ({
  // STATE's

  // ACTION's
  setWallet: (wallet) => setState({ wallet }),
  setAccount: (account) => setState({ account }),
  setAddresses: (addresses) => setState({ addresses }),
  setUTXOs: (utxos) => setState({ otxos: utxos })
}))

export const useWallet = store
