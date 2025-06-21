import { create } from 'zustand'

import { Locales, Theme } from '@/constants/enum'

type States = {
  appVersion: string
  loader: boolean
  theme: Theme
  language: Locales
}

type Actions = {
  setLanguage: (language: Locales) => void
  setTheme: (theme: Theme) => void
  setLoader: (value: boolean) => void
}

const store = create<States & Actions>((setState) => ({
  // STATE's
  appVersion: 'v0.1-beta (July, 2025)',
  loader: true,
  theme: Theme.DARK,
  language: Locales.UK,

  // ACTION's
  setLanguage: (language) => setState({ language }),
  setTheme: (theme) => setState({ theme }),
  setLoader: (value) => setState({ loader: value })
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
