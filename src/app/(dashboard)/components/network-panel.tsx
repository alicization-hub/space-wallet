import { SignalHigh } from "@keyline-icons/react/two-tone"

import { formatBytes } from "@/libs/utils"

import type { NodeTelemetry } from "../actions/read"
import { MetricCard } from "./metric-card"
import { Panel } from "./panel"
import { PeerTable } from "./peer-table"
import { StatusCard } from "./status-card"

/**
 * A byte count inside a card's value, with its unit set as `MetricCard` sets one beside the value.
 */
function Bytes({ bytes }: Readonly<{ bytes: number }>) {
  const { value, unit } = formatBytes(bytes)

  return (
    <>
      {value}
      <small className='text-space-400 pl-1 text-sm font-normal uppercase'>{unit}</small>
    </>
  )
}

export function NetworkPanel({
  network,
  peers
}: Readonly<Pick<NodeTelemetry, "network" | "peers">>) {
  const relayRatio =
    network.bytesReceived === 0 ? 0 : network.bytesSent / network.bytesReceived

  return (
    <Panel title='Network' icon={<SignalHigh className='size-5' />}>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
        <MetricCard
          label='Client'
          value={network.subversion}
          valueClassName='break-all'
          caption='Bitcoin Core'
        />
        <MetricCard
          label='Total recv/sent'
          value={
            <>
              <Bytes bytes={network.bytesReceived} />
              <span className='text-space-400 px-1.5 font-light'>/</span>
              <Bytes bytes={network.bytesSent} />
            </>
          }
          caption={`Relay ratio: ${relayRatio.toFixed(2)}x`}
        />
        <StatusCard
          label='Local stack'
          rows={[
            {
              name: "IPv4",
              value: network.hasIPv4 ? "yes" : "no",
              isOn: network.hasIPv4
            },
            {
              name: "IPv6",
              value: network.hasIPv6 ? "yes" : "no",
              isOn: network.hasIPv6
            },
            {
              name: "Tor v3",
              value: network.hasTor ? "active" : "no",
              isOn: network.hasTor
            }
          ]}
        />
      </div>

      <PeerTable peers={peers} />
    </Panel>
  )
}
