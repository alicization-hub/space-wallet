/**
 * Stops a script unless both ends are a terminal, so a secret can't arrive through a pipe or a file,
 * and a printed seed can't land in one (`… | tee out.log`). Call it before printing anything secret.
 */
export function requireTerminal() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error(
      "This needs an interactive terminal, without pipes or redirects (PowerShell or Windows Terminal; in Git Bash run it through winpty)."
    )
  }
}

/**
 * Reads a line from the terminal. Scripts ask for secrets here instead of taking them as arguments,
 * because an argument stays in the shell history and shows up in the process list.
 *
 * @param label - The prompt
 * @param options.isHidden - Don't echo what is typed. On by default, so a secret can't be shown by
 * mistake.
 * @returns What was typed
 * @throws When this isn't running in a terminal
 */
export async function commandInput(
  label: string,
  { isHidden = true }: { isHidden?: boolean } = {}
): Promise<string> {
  requireTerminal()

  return new Promise((resolve) => {
    process.stdout.write(`${label}: `)

    // Settings stdin to raw mode
    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.setEncoding("utf8")

    let input: string = ""

    const stop = () => {
      process.stdin.setRawMode(false)
      process.stdin.pause()
      process.stdin.removeListener("data", handleData)
      process.stdout.write("\n")
    }

    const handleData = (chunk: string) => {
      // Arrow keys and the like arrive as one escape sequence
      if (chunk.startsWith("\u001b")) return

      // A paste arrives as one chunk
      for (const key of chunk) {
        switch (key) {
          // Ctrl+C
          case "\u0003":
            stop()
            process.exit(130)
            break

          // Backspace
          case "\u007f":
          case "\b":
            if (input.length > 0) {
              input = input.slice(0, -1)
              if (!isHidden) process.stdout.write("\b \b")
            }
            break

          // Enter or Ctrl+D
          case "\u0004":
          case "\n":
          case "\r":
            stop()
            resolve(input)
            return

          default:
            input += key
            if (!isHidden) process.stdout.write(key)
            break
        }
      }
    }

    process.stdin.on("data", handleData)
  })
}

/**
 * Asks a yes/no question. Anything but `y` is a no.
 */
export async function commandConfirm(label: string) {
  const answer = await commandInput(`${label} (y/N)`, { isHidden: false })
  return answer.trim().toLowerCase() === "y"
}
