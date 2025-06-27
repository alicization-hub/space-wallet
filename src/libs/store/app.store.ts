import { create } from 'zustand'

import { Locales, Theme } from '@/constants/enum'

type States = {
  appVersion: string
  loader: boolean
  theme: Theme
  language: Locales
  node: {
    blocks: string
    network: string
  }
}

type Actions = {
  setLanguage: (language: States['language']) => void
  setTheme: (theme: States['theme']) => void
  setLoader: (value: States['loader']) => void
  setNode: (node: States['node']) => void
}

const store = create<States & Actions>((setState) => ({
  // STATE's
  appVersion: 'v0.1-beta (July, 2025)',
  loader: true,
  theme: Theme.DARK,
  language: Locales.UK,
  node: {
    blocks: '',
    network: ''
  },

  // ACTION's
  setLanguage: (language) => setState({ language }),
  setTheme: (theme) => setState({ theme }),
  setLoader: (value) => setState({ loader: value }),
  setNode: (node) => setState({ node })
}))

export const useStore = store

export const loader = {
  on: () => {
    store.setState({ loader: true })
    setTimeout(() => {
      store.setState({ loader: false })
    }, 5e3)
  },

  off: (delay: number = 250) => {
    setTimeout(() => {
      store.setState({ loader: false })
    }, delay)
  }
}
