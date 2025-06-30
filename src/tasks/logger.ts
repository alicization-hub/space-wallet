import { differenceInMilliseconds, format } from 'date-fns'

export function logger(message: string, ts?: number) {
  const arr = [
    `\x1b[32m[Task Scheduler]\x1b[0m`,
    `-`,
    `\x1b[37m${format(Date.now(), 'PPpp')}\x1b[0m`,
    ` `,
    `${message}\x1b[0m`
  ]

  if (ts) {
    const seconds = differenceInMilliseconds(Date.now(), ts) / 1e3
    arr.push(`~`, `\x1b[35m${seconds}s\x1b[0m`)
  }

  console.log(...arr)
}
