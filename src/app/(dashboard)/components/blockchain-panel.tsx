import { PackageIcon } from "@keyline-icons/react/duotone"

import { Chip } from "@/components/ui/chip"
import { formatBytes, formatDifficulty, formatHashrate } from "@/libs/utils"

import type { NodeTelemetry } from "../actions/read"
import { formatBlockTime, formatChange, formatInteger, NO_VALUE } from "../utils"
import { MetricCard } from "./metric-card"
import { Panel } from "./panel"

export function BlockchainPanel({
  chain,
  hashrate,
  retarget
}: Readonly<Pick<NodeTelemetry, "chain" | "hashrate" | "retarget">>) {
  const disk = formatBytes(chain.sizeOnDisk)
  const medianTime = formatBlockTime(chain.medianTime)
  const speed = hashrate === null ? null : formatHashrate(hashrate)

  return (
    <Panel
      title='Blockchain'
      icon={<PackageIcon className='size-5' />}
      aside={
        <Chip className='opacity-75' color='secondary'>
          {`Median time: ${medianTime.date} ${medianTime.time} (UTC)`}
        </Chip>
      }>
      <div className='grid grid-cols-4 gap-x-4'>
        <MetricCard
          label='Disk occupancy'
          value={disk.value}
          unit={disk.unit}
          caption={chain.isPruned ? "Pruned node" : "Archival full node"}
        />
        <MetricCard
          label='Hashrate'
          value={speed?.value ?? NO_VALUE}
          unit={speed?.unit}
          caption='Last 120 blocks'
        />
        <MetricCard
          label='Difficulty'
          value={formatDifficulty(chain.difficulty)}
          caption={
            retarget?.nextDifficulty != null &&
            `Next: ~${formatDifficulty(retarget.nextDifficulty)}`
          }
        />
        <MetricCard
          label='Next retarget'
          value={retarget?.change != null ? formatChange(retarget.change) : NO_VALUE}
          caption={
            retarget
              ? `In ${formatInteger(retarget.blocksLeft)} blocks`
              : "No estimate yet"
          }
        />
      </div>
    </Panel>
  )
}
