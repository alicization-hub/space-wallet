'use client'

import { secondsToMilliseconds } from 'date-fns'
import { useParams } from 'next/navigation'
import { omit } from 'ramda'
import { useMemo } from 'react'
import { v7 as uuidV7 } from 'uuid'

import { useEffectSync, useStore, useWallet } from '@/hooks'
import { type AccountInfo } from '@/libs/actions/account'
import { type NodeInfo } from '@/libs/actions/rpc'

export default function DataObserver() {
  // __STATE's
  const setNode = useStore((state) => state.setNode)
  const setWallet = useWallet((state) => state.setWallet)
  const setAccount = useWallet((state) => state.setAccount)
  const setBalance = useWallet((state) => state.setBalance)

  const params = useParams()
  const uuid = useMemo(() => params?.uuid || uuidV7(), [params])

  // __EFFECT's
  useEffectSync(
    async () => {
      const response = await fetch(`/v0/${uuid}?id=0&ts=${new Date().getTime()}`, { method: 'POST' })
      const data: NodeInfo = await response.json()
      if (data) {
        setNode({
          blocks: data.blocks,
          network: data.connection
        })
      }
    },
    100,
    {
      deps: [uuid],
      bool: true,
      interval: secondsToMilliseconds(30)
    }
  )

  useEffectSync(
    async () => {
      const response = await fetch(`/v0/${uuid}?id=1&ts=${new Date().getTime()}`, { method: 'POST' })
      const data: AccountInfo = await response.json()
      if (data) {
        setWallet(data.wallet)
        setAccount(omit(['wallet', 'balances'], data))
        setBalance(data.balances)
      }
    },
    200,
    {
      deps: [uuid],
      bool: Boolean(params?.uuid),
      interval: secondsToMilliseconds(15)
    }
  )

  // __RENDER
  return null
}
