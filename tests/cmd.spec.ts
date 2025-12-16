export async function commandInput(label: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(`${label}: `)

    // Settings stdin to raw mode
    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.setEncoding('utf8')

    let input: string = ''

    const handleData = (key: string) => {
      switch (key) {
        // Ctrl+C
        case '\u0003':
          process.exit()
          break

        // Backspace
        case '\u007f':
        case '\b':
          if (input.length > 0) {
            input = input.slice(0, -1)
          }
          break

        // Enter or Ctrl+D
        case '\u0004':
        case '\n':
        case '\r':
          process.stdin.setRawMode(false)
          process.stdin.pause()
          process.stdin.removeListener('data', handleData)
          process.stdout.write('\n')
          resolve(input)
          break

        default:
          input += key
          break
      }
    }

    process.stdin.on('data', handleData)
  })
}

async function main() {
  try {
    const password = await commandInput('🔑 Enter password')
    console.log('📝 Password', password)
  } catch (error) {
    console.error('⚠️ An error occurred:')
    console.log(error)
  }
}

main()
