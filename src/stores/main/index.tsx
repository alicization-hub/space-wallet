"use client"

import { createContext, useContext, useRef, type ReactNode } from "react"
import { useStore } from "zustand"

import { createMainStore, type MainState, type MainStore } from "./state"

type Store = MainStore | null

const StoreContext = createContext<Store>(null)

export function MainStoreProvider({ children }: Readonly<{ children: ReactNode }>) {
  const storeRef = useRef<Store>(null)
  if (!storeRef.current) {
    storeRef.current = createMainStore({
      appVersion: "v0.3-canary (Oct, 2026)",
      loader: true
    })
  }

  return <StoreContext value={storeRef.current}>{children}</StoreContext>
}

export function useMainStore<T>(selector: (state: MainState) => T) {
  const store = useContext(StoreContext)
  if (!store) {
    throw new Error("useMainStore must be used within MainStoreProvider")
  }

  return useStore(store, selector)
}
