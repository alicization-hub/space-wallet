export async function commandInput(label: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(`Enter ${label}: `)

    // Settings stdin to raw mode
    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.setEncoding('utf8')

    let password: string = ''

    const handleData = (key: string) => {
      switch (key) {
        // Ctrl+C
        case '\u0003':
          process.exit()
          break

        // Backspace
        case '\u007f':
        case '\b':
          if (password.length > 0) {
            password = password.slice(0, -1)
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
          resolve(password)
          break

        default:
          password += key
          break
      }
    }

    process.stdin.on('data', handleData)
  })
}
