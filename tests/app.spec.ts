import fs from "fs"
import path from "path"
import timers from "timers"

import { db, schema } from "@/drizzle"
import { logger } from "@/libs/logger"

async function main() {
  const startedAt = new Date()

  // TODO:
  await timers.promises.setTimeout(1_000)

  logger("✅ Success", startedAt)
}

main()
  .catch((error) => {
    logger(`🚫 An error occurred: ${error}`)
    process.exit(1)
  })
  .finally(() => {
    process.exit(0)
  })
