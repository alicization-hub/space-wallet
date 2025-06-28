import { readFileSync } from 'fs'
import { createServer } from 'https'
import { parse } from 'url'

import next from 'next'

const key = readFileSync('./certificates/localhost-key.pem')
const cert = readFileSync('./certificates/localhost.pem')

const app = next({ dev: false })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer({ key, cert }, (req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  })
    .listen(3000)
    .on('listening', () => {
      console.info('\x1b[32m✓ \x1b[0mServer running at:', `\x1b[32mhttps://127.0.0.1:3000\x1b[0m`)
    })
})
