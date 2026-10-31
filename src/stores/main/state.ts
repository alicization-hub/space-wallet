import { createStore } from "zustand"

type State = {
  appVersion: string
  loader: boolean
}

type Actions = {
  setLoader: (loader: State["loader"]) => void
}

export type MainState = State & Actions

export const createMainStore = (initialState: State) =>
  createStore<MainState>()((setState) => ({
    ...initialState,
    setLoader: (loader) => setState({ loader })
  }))

export type MainStore = ReturnType<typeof createMainStore>
