import { readFileSync } from 'fs'
import { createServer } from 'https'
import { parse, URL } from 'url'

import next from 'next'

const key = readFileSync('./certificates/localhost-key.pem')
const cert = readFileSync('./certificates/localhost.pem')
const url = new URL(process.env.NEXT_PUBLIC_BASE_URL!)

const app = next({
  port: parseInt(url.port),
  dev: false,
  turbo: true,
  turbopack: true,
  experimentalHttpsServer: true
})
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer({ key, cert }, (req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  })
    .listen(url.port)
    .on('listening', () => {
      console.info('\x1b[32m✓ \x1b[0mServer running at:', `\x1b[32m${url.origin}\x1b[0m`)
    })
})
