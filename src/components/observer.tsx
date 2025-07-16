'use client'

import { formatISO, secondsToMilliseconds } from 'date-fns'
import { useParams } from 'next/navigation'
import { omit } from 'ramda'
import { useMemo } from 'react'
import { v7 as uuidV7 } from 'uuid'

import { useEffectSync, useStore, useWallet } from '@/hooks'

export default function DataObserver() {
  // __STATE's
  const setNode = useStore((state) => state.setNode)
  const setWallet = useWallet((state) => state.setWallet)
  const setAccount = useWallet((state) => state.setAccount)

  const params = useParams()
  const uuid = useMemo(() => params?.uuid || uuidV7(), [params])

  // __EFFECT's
  useEffectSync(
    async () => {
      await fetch(`/v0/${uuid}?ts=${formatISO(Date.now())}`, { method: 'POST' })
    },
    32,
    { deps: [uuid], bool: Boolean(params?.uuid), interval: secondsToMilliseconds(5) }
  )

  useEffectSync(
    async () => {
      const response = await fetch(`/v0/${uuid}?id=0&ts=${formatISO(Date.now())}`)
      const data = await response.json()
      if (data) {
        setNode({
          blocks: data.blocks,
          network: data.connection
        })
      }
    },
    128,
    { deps: [uuid], bool: true, interval: secondsToMilliseconds(30) }
  )

  useEffectSync(
    async () => {
      const response = await fetch(`/v0/${uuid}?id=1&ts=${formatISO(Date.now())}`)
      const data = await response.json()
      if (data) {
        setWallet(omit(['account'], data) as any)
        setAccount(data.account)
      }
    },
    128,
    { deps: [uuid], bool: Boolean(params?.uuid), interval: secondsToMilliseconds(15) }
  )

  // __RENDER
  return null
}
