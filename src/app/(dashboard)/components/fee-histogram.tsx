import { cls, formatPercent } from "@/libs/utils"

import type { NodeTelemetry } from "../actions/read"
import { formatBytesText } from "../utils"

/**
 * Amber is the wallet's colour for fees, brighter as the fee rate climbs. The colour belongs to the
 * band, not to whichever is tallest right now.
 */
const BAND_COLORS = ["bg-amber-800", "bg-amber-700", "bg-amber-600", "bg-amber-500"]

/**
 * How much of the mempool sits in each fee band. Every value is printed under its bar, so the tooltip
 * adds nothing that can't be read without a mouse.
 */
export function FeeHistogram({
  bands
}: Readonly<{ bands: NodeTelemetry["mempool"]["feeBands"] }>) {
  const total = bands?.reduce((sum, { vBytes }) => sum + vBytes, 0) ?? 0
  const tallest = bands ? Math.max(...bands.map(({ vBytes }) => vBytes)) : 0

  return (
    <div className='mirror flex flex-col justify-between gap-2 rounded-xs p-4'>
      <div className='text-space-200 text-xs font-light select-none'>
        Congestion by fee rate
      </div>

      {bands ? (
        <ul className='grid grid-cols-4 gap-2'>
          {bands.map(({ label, vBytes }, index) => (
            <li
              className='flex flex-col gap-1.5'
              title={`${label}/vB: ${formatBytesText(vBytes)} virtual`}
              key={label}>
              <div className='bg-space-50/5 flex h-28 flex-col justify-end rounded-xs'>
                {vBytes > 0 && (
                  <div
                    className={cls("min-h-0.5 rounded-xs", BAND_COLORS[index])}
                    style={{ height: `${(vBytes / tallest) * 100}%` }}
                  />
                )}
              </div>
              <div className='font-number text-center'>
                <div className='text-space-400 text-xs'>{label}</div>
                <div className='text-sm font-semibold'>
                  {formatPercent(total === 0 ? 0 : vBytes / total)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className='text-space-500 font-number bg-space-50/5 flex h-28 items-center justify-center rounded-xs px-2 text-center text-sm font-light select-none'>
          This version of Bitcoin Core doesn&apos;t report fee bands.
        </div>
      )}
    </div>
  )
}
