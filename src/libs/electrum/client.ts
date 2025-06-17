import { EventEmitter } from 'events'
import { Socket } from 'net'
import { TLSSocket, type ConnectionOptions } from 'tls'

import { connectSocket, initSocket } from './socket'
import { createPromiseResult, createRecuesiveParser, createRequest, MessageParser } from './utils'

export class Client {
  private vid: number = 0
  private port: number
  private host: string
  private callbackMessageQueue: Record<number, any>
  private readonly subscribe: EventEmitter
  private readonly messageParser: MessageParser
  private conn: Socket | TLSSocket
  private status: number

  constructor(protocol: 'tcp' | 'tls' = 'tcp', host: string, port: number, options?: ConnectionOptions) {
    this.port = port
    this.host = host
    this.callbackMessageQueue = {}
    this.subscribe = new EventEmitter()
    this.conn = initSocket(this, protocol, options || {})
    this.messageParser = new MessageParser((body, n) => {
      this.onMessage(body, n)
    })

    this.status = 0
  }

  connect(): Promise<void> {
    if (this.status) {
      return Promise.resolve()
    }

    this.status = 1
    return connectSocket(this.conn, this.port, this.host)
  }

  close(): void {
    if (!this.status) {
      return void 0
    }

    this.conn.end()
    this.conn.destroy()
    this.status = 0
  }

  request(method: string, params: any[] = []): Promise<any> {
    if (!this.status) {
      return Promise.reject(new Error('ESOCKET'))
    }
    return new Promise((resolve, reject) => {
      const vid = this.vid + 1
      const content = createRequest(vid, method, params)
      this.callbackMessageQueue[vid] = createPromiseResult(resolve, reject)
      this.conn.write(content + '\n')
    })
  }

  private response(msg: any): void {
    const callback: any = this.callbackMessageQueue[msg.id]
    if (callback) {
      delete this.callbackMessageQueue[msg.id]
      if (msg.error) {
        callback(msg.error)
      } else {
        callback(null, msg.result)
      }
    } else {
      // can't get callback
    }
  }

  private onMessage(body: string, n: number): void {
    const msg = JSON.parse(body)
    if (msg instanceof Array) {
      // don't support batch request
    } else {
      if (msg.id !== void 0) {
        this.response(msg)
      } else {
        this.subscribe.emit(msg.method, msg.params)
      }
    }
  }

  onConnect(): void {}

  onClose(): void {
    const queues = Object.keys(this.callbackMessageQueue) as unknown[] as number[]
    for (const key of queues) {
      this.callbackMessageQueue[key](new Error('close connect'))
      delete this.callbackMessageQueue[key]
    }
  }

  onRecv(chunk: Buffer): void {
    this.messageParser.run(chunk as any)
  }

  onEnd(): void {}

  onError(e: Error): void {}

  removeListener(event: string) {
    this.subscribe.removeAllListeners(event)
  }
}
