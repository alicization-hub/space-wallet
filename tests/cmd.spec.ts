import { DrizzleQueryError } from "drizzle-orm"

import { COLOR, logger } from "@/libs/logger"

export type Question = {
  /** What is asked, in a few words */
  label: string
  /** What to type, or why it's asked */
  description?: string
  /** Don't echo what is typed. On by default, so a secret can't be shown by mistake. */
  isHidden?: boolean
}

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
 * Asks a question in the terminal and reads a line. Scripts ask for secrets here instead of taking
 * them as arguments, because an argument stays in the shell history and shows up in the process list.
 *
 * @example
 * ```text
 * [SPACE] - Nov 8, 2026, 10:00:00 AM 📝 Amount
 *    In BTC, with at most 8 decimals.
 * input: 0.01
 * ```
 *
 * @returns What was typed
 * @throws When this isn't running in a terminal
 */
export async function commandInput({
  label,
  description,
  isHidden = true
}: Question): Promise<string> {
  requireTerminal()

  logger(`${isHidden ? "🔑" : "📝"} ${label}`)
  if (description) {
    logger(`${COLOR.FG.Gray}${description}${COLOR.RESET}`)
  }

  return new Promise((resolve) => {
    const hint = isHidden ? " (hidden)" : ""
    process.stdout.write(`${COLOR.FG.Yellow}Input${hint}:${COLOR.RESET} `)

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
export async function commandConfirm({ label, description }: Question) {
  const answer = await commandInput({
    label: `${label} (y/N)`,
    description,
    isHidden: false
  })
  return answer.trim().toLowerCase() === "y"
}

/**
 * Replaces the web's credentials in the env with the terminal's: the owner role in Postgres, and
 * `rpc_space_terminal` on the node. They're in no file, because anything running as this user can
 * read every file this user can.
 *
 * `@/constants/env` reads the env once, when first imported, so call this before importing anything
 * that uses it.
 */
export async function askTerminalCredentials() {
  const { DB_OWNER } = process.env
  if (!DB_OWNER)
    throw new Error("DB_OWNER is missing from .env. See docs/setup-guide.md.")

  const password = await commandInput({
    label: "Terminal password",
    description: "Opens the database and the node for this run."
  })

  process.env.DB_USER = DB_OWNER
  process.env.DB_PASSWORD = password
  process.env.RPC_USERNAME = "rpc_space_terminal"
  process.env.RPC_PASSWORD = password
}

/**
 * A failed query's own message repeats the statement, and the error holds the values it was given,
 * which can include `bio` and `passkey`. Only the reason is shown.
 */
export function describeError(error: unknown) {
  if (error instanceof DrizzleQueryError) {
    return `The database refused the change: ${error.cause?.message}`
  }

  const message = error instanceof Error ? error.message : String(error)

  // A script that reaches this has logged in to the node with the terminal password
  return message === "HTTP 401 Unauthorized" ? "Wrong terminal password." : message
}

/**
 * Removes control and formatting characters from text the DB or the node gave, so an escape sequence
 * in it can't rewrite what's on the screen.
 */
export function toPrintable(text: string) {
  return text.replace(/\p{C}/gu, "")
}
