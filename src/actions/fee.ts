"use server"

import { secondsToMilliseconds } from "date-fns"
import { cacheLife, cacheTag } from "next/cache"
import { z } from "zod"

import { logger } from "@/libs/logger"

const feesValidator = z.object({
  fastestFee: z.number().positive(),
  hourFee: z.number().positive(),
  economyFee: z.number().positive(),
  minimumFee: z.number().positive()
})

/**
 * The response is checked before use because it comes from a third party and decides how much a
 * send pays. The clamps below bound the rates even if mempool.space returns something wrong.
 */
async function readRecommendedFees() {
  "use cache"
  cacheTag("fees/recommended")
  cacheLife("minutes")

  const res = await fetch("https://mempool.space/api/v1/fees/recommended", {
    signal: AbortSignal.timeout(secondsToMilliseconds(10))
  })
  if (!res.ok) {
    throw new Error(`mempool.space answered with HTTP ${res.status}`)
  }

  const data = feesValidator.parse(await res.json())

  return [
    {
      label: "highest",
      duration: "~10 minutes",
      value: Math.min(Math.max(data.fastestFee, 10), 50)
    },
    {
      label: "medium",
      duration: "~30 minutes",
      value: Math.min(Math.max(data.hourFee, 5), 20)
    },
    {
      label: "economy",
      duration: "~50 minutes",
      value: Math.min(Math.max(data.economyFee, 2), 10)
    },
    {
      label: "lowest",
      duration: "~1 hour",
      value: Math.min(Math.max(data.minimumFee, 1), 5)
    }
  ]
}

export async function readFees() {
  try {
    return { success: true as const, data: await readRecommendedFees() }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger(`⚠️ readFees failed: ${message}`)

    return {
      success: false as const,
      message: "Could not load the recommended fees. Close this form and try again."
    }
  }
}
