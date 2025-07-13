'use client'

import { formatISO, secondsToMilliseconds } from 'date-fns'
import { useParams } from 'next/navigation'
import { omit } from 'ramda'

import { useEffectSync, useStore, useWallet } from '@/hooks'

export default function DataObserver() {
  // __STATE's
  const params = useParams()
  const setNode = useStore((state) => state.setNode)
  const setWallet = useWallet((state) => state.setWallet)
  const setAccount = useWallet((state) => state.setAccount)

  // __EFFECT's
  useEffectSync(
    async () => {
      const response = await fetch(`/v0/${params.uuid}?id=0&ts=${formatISO(Date.now())}`)
      const data = await response.json()
      if (data) {
        setNode({
          blocks: data.blocks,
          network: data.connection
        })
      }
    },
    256,
    { deps: [params.uuid], bool: Boolean(params.uuid), interval: secondsToMilliseconds(30) }
  )

  useEffectSync(
    async () => {
      const response = await fetch(`/v0/${params.uuid}?id=1&ts=${formatISO(Date.now())}`)
      const data = await response.json()
      if (data) {
        setWallet(omit(['account'], data) as any)
        setAccount(data.account)
      }
    },
    128,
    { deps: [params.uuid], bool: Boolean(params.uuid), interval: secondsToMilliseconds(15) }
  )

  // __RENDER
  return null
}
