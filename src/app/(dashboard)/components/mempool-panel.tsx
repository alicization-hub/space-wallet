import { LayersIcon } from "@keyline-icons/react/duotone"

import { Chip } from "@/components/ui/chip"
import { COIN } from "@/libs/bitcoin/constants"
import { formatBytes, formatBytesText, formatPercent } from "@/libs/utils"

import type { NodeTelemetry } from "../actions/read"
import { formatFeeRate, formatInteger, NO_VALUE } from "../utils"
import { FeeHistogram } from "./fee-histogram"
import { MetricCard } from "./metric-card"
import { Panel } from "./panel"

export function MempoolPanel({
  mempool
}: Readonly<{ mempool: NodeTelemetry["mempool"] }>) {
  const backlog = formatBytes(mempool.vBytes)
  const allocation = mempool.usage / mempool.maxUsage

  return (
    <Panel
      title='Mempool'
      icon={<LayersIcon className='size-5' />}
      aside={
        <Chip className='opacity-75' color={mempool.isLoaded ? "success" : "secondary"}>
          {mempool.isLoaded ? "loaded" : "loading"}
        </Chip>
      }>
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <MetricCard
            label='Unconfirmed txs'
            value={formatInteger(mempool.size)}
            caption={`Backlog: ${backlog.value} v${backlog.unit}`}
          />
          <MetricCard
            label='Total tx fees'
            value={mempool.totalFee.toFixed(4)}
            unit='BTC'
            valueClassName='text-amber-100'
            caption={`Avg: ${
              mempool.vBytes === 0
                ? NO_VALUE
                : formatFeeRate((mempool.totalFee * COIN) / mempool.vBytes)
            }`}
          />

          <div className='mirror flex flex-col gap-2 rounded-xs p-4 sm:col-span-2'>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <span className='text-space-200 text-xs font-light select-none'>
                Pool allocation (max {mempool.maxUsage / 1_000_000} MB)
              </span>
              <span className='font-number text-sm font-semibold'>
                {formatBytesText(mempool.usage)} ({formatPercent(allocation)})
              </span>
            </div>

            <div
              className='bg-space-50/10 h-1 rounded-xs'
              role='meter'
              aria-label='Mempool memory in use'
              aria-valuemin={0}
              aria-valuemax={mempool.maxUsage}
              aria-valuenow={mempool.usage}>
              <div
                className='bg-space-50 h-full rounded-xs'
                style={{ width: formatPercent(Math.min(allocation, 1)) }}
              />
            </div>

            <div className='text-space-400 flex flex-wrap items-center justify-between gap-2 text-xs'>
              <span>Min relay: {formatFeeRate(mempool.minRelayFeeRate)}</span>
              <span>Mempool min: {formatFeeRate(mempool.minFeeRate)}</span>
            </div>
          </div>
        </div>

        <FeeHistogram bands={mempool.feeBands} />
      </div>
    </Panel>
  )
}
