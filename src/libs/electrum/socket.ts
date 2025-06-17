import { Socket } from 'net'
import { TLSSocket, type ConnectionOptions } from 'tls'

const TIMEOUT = 10_000

const getSocket = (protocol: 'tcp' | 'tls' | 'ssl', options: ConnectionOptions): Socket | TLSSocket => {
  switch (protocol) {
    case 'tcp':
      return new Socket()

    case 'tls':
    case 'ssl':
      return new TLSSocket(new Socket(), options)
  }
}

export function initSocket(
  self: any,
  protocol: 'tcp' | 'tls' | 'ssl',
  options: ConnectionOptions
): Socket | TLSSocket {
  const conn = getSocket(protocol, options)
  conn.setTimeout(TIMEOUT)
  conn.setEncoding('utf8')
  conn.setKeepAlive(true, 0)
  conn.setNoDelay(true)

  conn.on('connect', () => {
    conn.setTimeout(0)
    self.onConnect()
  })

  conn.on('close', (e) => {
    self.onClose(e)
  })

  conn.on('timeout', () => {
    const e = new Error('ETIMEDOUT', { cause: 'ETIMEDOUT' })
    conn.emit('error', e)
  })

  conn.on('data', (chunk) => {
    conn.setTimeout(0)
    self.onRecv(chunk)
  })

  conn.on('end', (e: any) => {
    conn.setTimeout(0)
    self.onEnd(e)
  })

  conn.on('error', (e) => {
    self.onError(e)
  })
  return conn
}

export function connectSocket(conn: Socket | TLSSocket, port: number, host: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const errorHandler = (e: any) => reject(e)
    conn.connect(port, host, () => {
      conn.removeListener('error', errorHandler)
      resolve()
    })
    conn.on('error', errorHandler)
  })
}
