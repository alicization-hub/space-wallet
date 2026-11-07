import { Chip } from "@/components/ui/chip"
import { cls, formatBytesText } from "@/libs/utils"

import type { NodeTelemetry } from "../actions/read"
import { formatInteger, NO_VALUE } from "../utils"

type Peer = NodeTelemetry["peers"][number]

/**
 * The networks that hide where a peer is, by the name the table gives them.
 */
const OVERLAY_NETWORKS: Record<string, string> = {
  onion: "tor",
  i2p: "i2p",
  cjdns: "cjdns"
}

/**
 * From here a peer counts as slow, in milliseconds.
 */
const SLOW_PING = 100

/**
 * Longest address shown in full. A v3 onion address is 62 characters.
 */
const MAX_ADDRESS_LENGTH = 28

const COLUMN_CLASS =
  "text-space-400 px-3 py-2 text-left text-xs font-light whitespace-nowrap capitalize select-none"

function readPeerType({ network, isInbound }: Peer) {
  const overlay = OVERLAY_NETWORKS[network]
  if (overlay) return `${overlay} ${isInbound ? "in" : "out"}`

  return isInbound ? "inbound" : "outbound"
}

function PeerAddress({ address }: Readonly<{ address: string }>) {
  if (address.length <= MAX_ADDRESS_LENGTH) return address

  return (
    <>
      {address.slice(0, 6)}
      <span className='text-space-400'>…</span>
      {address.slice(-16)}
    </>
  )
}

function PeerRow({ peer }: Readonly<{ peer: Peer }>) {
  const ping = peer.pingTime === null ? null : Math.round(peer.pingTime * 1000)

  return (
    <tr className='hover:bg-space-50/5 border-space-50/10 h-10 border-t transition-colors'>
      <td className='text-space-400 px-3 whitespace-nowrap'>#{peer.id}</td>
      <td className='px-3 font-semibold whitespace-nowrap' title={peer.address}>
        <PeerAddress address={peer.address} />
      </td>
      <td className='text-space-200 max-w-40 truncate px-3' title={peer.subversion}>
        {peer.subversion}
      </td>
      <td
        className={cls(
          "px-3 text-right whitespace-nowrap",
          ping !== null && ping >= SLOW_PING && "text-amber-500"
        )}>
        {ping === null ? NO_VALUE : `${formatInteger(ping)} ms`}
      </td>
      <td className='text-space-200 px-3 text-right whitespace-nowrap'>
        {formatBytesText(peer.bytesSent)} / {formatBytesText(peer.bytesReceived)}
      </td>
      <td className='text-space-200 word-tight px-3 text-right whitespace-nowrap'>
        {peer.height < 0 ? NO_VALUE : formatInteger(peer.height)}
      </td>
      <td className='px-3 text-center whitespace-nowrap'>
        <Chip
          className='font-display opacity-75'
          color={peer.network in OVERLAY_NETWORKS ? "success" : "secondary"}>
          {readPeerType(peer)}
        </Chip>
      </td>
    </tr>
  )
}

export function PeerTable({ peers }: Readonly<{ peers: Peer[] }>) {
  return (
    <div className='mirror overflow-x-auto rounded-xs'>
      <table className='font-number w-full text-sm tabular-nums'>
        <thead>
          <tr>
            <th className={COLUMN_CLASS}>ID</th>
            <th className={COLUMN_CLASS}>Address</th>
            <th className={COLUMN_CLASS}>Client</th>
            <th className={cls(COLUMN_CLASS, "text-right")}>Ping</th>
            <th className={cls(COLUMN_CLASS, "text-right")}>Sent / recv</th>
            <th className={cls(COLUMN_CLASS, "text-right")}>Height</th>
            <th className={cls(COLUMN_CLASS, "text-center")}>Type</th>
          </tr>
        </thead>
        <tbody>
          {peers.length > 0 ? (
            peers.map((peer) => <PeerRow peer={peer} key={peer.id} />)
          ) : (
            <tr className='border-space-50/10 h-10 border-t'>
              <td className='text-space-500 px-3 text-center' colSpan={7}>
                No peers connected.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
