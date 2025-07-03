'use client'

import { formatISO, secondsToMilliseconds } from 'date-fns'
import { useParams } from 'next/navigation'
import { omit } from 'ramda'
import { useEffect } from 'react'

import { useStore, useWallet } from '@/hooks'

export default function DataObserver({}: Readonly<{}>) {
  // __STATE's
  const params = useParams()
  const setNode = useStore((state) => state.setNode)
  const setWallet = useWallet((state) => state.setWallet)
  const setAccount = useWallet((state) => state.setAccount)

  // __EFFECT's
  useEffect(() => {
    const func = async () => {
      const response = await fetch(`/v0/${params.uuid}?id=0&ts=${formatISO(Date.now())}`)
      const data = await response.json()
      if (data) {
        setTimeout(() => {
          setNode({
            blocks: data.blocks,
            network: data.connection
          })
        }, 5e2)
      }

      setTimeout(() => func(), secondsToMilliseconds(30))
    }

    if (params.uuid) {
      const timeoutId = setTimeout(() => func(), 200)
      return () => clearTimeout(timeoutId)
    }
  }, [params])

  useEffect(() => {
    const func = async () => {
      const response = await fetch(`/v0/${params.uuid}?id=1&ts=${formatISO(Date.now())}`)
      const data = await response.json()
      if (data) {
        setTimeout(() => {
          setWallet(omit(['account'], data) as any)
          setAccount(data.account)
        }, 5e2)
      }
    }

    if (params.uuid) {
      const intervalId = setInterval(() => func(), secondsToMilliseconds(15))
      return () => clearInterval(intervalId)
    }
  }, [params])

  // __RENDER
  return null
}
