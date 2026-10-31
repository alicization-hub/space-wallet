import { readFileSync } from "fs"
import { createServer } from "https"

import next from "next"

const key = readFileSync("./certificates/localhost-key.pem")
const cert = readFileSync("./certificates/localhost.pem")

const url = new URL(process.env.NEXT_PUBLIC_BASE_URL!)
const port = parseInt(url.port) || 3000

/**
 * The wallet is only for this machine. `localhost` resolves to this address as well, so it opens under
 * both names, and `src/proxy.ts` refuses any other.
 */
const hostname = "127.0.0.1"

const app = next({ dev: false, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer({ key, cert, minVersion: "TLSv1.2" }, (req, res) => {
    handle(req, res)
  })
    .listen(port, hostname)
    .on("listening", () => {
      console.info(
        "\x1b[32m✓ \x1b[0mServer running at:",
        `\x1b[32mhttps://localhost:${port}\x1b[0m`,
        `\x1b[32mhttps://127.0.0.1:${port}\x1b[0m`
      )
    })
})
