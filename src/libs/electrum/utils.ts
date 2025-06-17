// import { getUnixTime } from 'date-fns'

export function createRequest(vid: number, method: string, params: any[] = []): string {
  return JSON.stringify({
    id: vid,
    jsonrpc: '2.0',
    method: method,
    params: params
  })
}

export function createRecuesiveParser(max_depth: number, delimiter: string) {
  const MAX_DEPTH = max_depth
  const DELIMITER = delimiter
  return (
    n: number,
    buffer: string,
    callback: (chunk: string, n: number) => void
  ): { code: number; buffer: string } => {
    if (buffer.length === 0) {
      return { code: 0, buffer: buffer }
    }
    if (n > MAX_DEPTH) {
      return { code: 1, buffer: buffer }
    }
    const xs = buffer.split(DELIMITER)
    if (xs.length === 1) {
      return { code: 0, buffer: buffer }
    }
    callback(xs.shift()!, n)
    return createRecuesiveParser(MAX_DEPTH, DELIMITER)(n + 1, xs.join(DELIMITER), callback)
  }
}

export function createPromiseResult(resolve: (value: unknown) => void, reject: (reason?: any) => void) {
  return (err: Error | null, result: unknown) => {
    if (err) reject(err)
    else resolve(result)
  }
}

export class MessageParser {
  private buffer: string = ''

  constructor(callback: (chunk: string, n: number) => void) {
    this.callback = callback
    this.recursiveParser = createRecuesiveParser(20, '\n')
  }

  private callback: (chunk: string, n: number) => void

  private recursiveParser: (
    n: number,
    buffer: string,
    callback: (chunk: string, n: number) => void
  ) => { code: number; buffer: string }

  public run(chunk: string) {
    this.buffer += chunk
    while (true) {
      const res = this.recursiveParser(0, this.buffer, this.callback)
      this.buffer = res.buffer
      if (res.code === 0) {
        break
      }
    }
  }
}
