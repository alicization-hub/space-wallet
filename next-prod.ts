import { readFileSync } from 'fs'
import { createServer } from 'https'
import { parse } from 'url'

import next from 'next'

const key = readFileSync('./certificates/localhost-key.pem')
const cert = readFileSync('./certificates/localhost.pem')

const url = new URL(process.env.NEXT_PUBLIC_BASE_URL!)
const port = parseInt(url.port) || 3000

const app = next({ dev: false })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer({ key, cert }, (req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  })
    .listen(port)
    .on('listening', () => {
      console.info('\x1b[32m✓ \x1b[0mServer running at:', `\x1b[32mhttps://127.0.0.1:${port}\x1b[0m`)
    })
})
