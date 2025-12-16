import { logger } from '@/libs/logger'

async function main() {
  const startedAt = new Date()

  try {
    // TODO:
  } catch (error) {
    logger(`⚠️ An error occurred: ${error}`, startedAt)
  }

  process.exit()
}

main()
