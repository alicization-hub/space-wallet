/**
 * Scaffolds a route folder under `(wallet)` that follows the route folder layout.
 *
 * Usage (from the repo root):
 * ```bash
 * bun .claude/skills/web-stack/scripts/new-route.ts <segment>
 * bun .claude/skills/web-stack/scripts/new-route.ts settings
 * bun .claude/skills/web-stack/scripts/new-route.ts settings/[id]
 * ```
 *
 * Existing files are never overwritten.
 */
import fs from "node:fs"
import path from "node:path"

const [segment] = process.argv.slice(2)

if (!segment) {
  console.error("Usage: bun new-route.ts <segment>   e.g. settings or settings/[id]")
  process.exit(1)
}

const appDir = path.resolve("src/app/(wallet)")
if (!fs.existsSync(appDir)) {
  console.error("Run this from the repo root (src/app/(wallet) not found).")
  process.exit(1)
}

const parts = segment.split("/").filter(Boolean)
const dynamicParams = parts
  .filter((part) => /^\[.+\]$/.test(part))
  .map((part) => part.slice(1, -1))
const baseName = parts.filter((part) => !/^\[.+\]$/.test(part)).at(-1) ?? "Index"
const componentName = baseName
  .split("-")
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  .join("")

const routeDir = path.join(appDir, ...parts)

const props =
  dynamicParams.length > 0
    ? `{ params }: NextParams<{ ${dynamicParams.map((param) => `${param}: string`).join("; ")} }>`
    : ""
const readParams =
  dynamicParams.length > 0
    ? `  const { ${dynamicParams.join(", ")} } = await params\n`
    : ""

const files: Record<string, string> = {
  "page.tsx": `import { connection } from "next/server"

export const instant = false

export default async function ${componentName}(${props}) {
  await connection()
${readParams}
  return <div className='flex flex-col gap-4'></div>
}
`,
  "actions/read.ts": `"use server"
`,
  "utils.ts": "",
  "validator.nuqs.ts": `import { createSearchParamsCache, parseAsInteger } from "nuqs/server"

export const queryValidator = createSearchParamsCache({
  page: parseAsInteger.withDefault(1)
})

export type QueryValidator = Awaited<ReturnType<typeof queryValidator.parse>>
`,
  "validator.zod.ts": `import { z } from "zod"

export const formValidator = z.object({})

export type FormValidator = z.infer<typeof formValidator>
`
}

fs.mkdirSync(path.join(routeDir, "components"), { recursive: true })

for (const [relativePath, content] of Object.entries(files)) {
  const filePath = path.join(routeDir, relativePath)
  const displayPath = path.relative(process.cwd(), filePath)

  if (fs.existsSync(filePath)) {
    console.log(`skip    ${displayPath}`)
    continue
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content)
  console.log(`create  ${displayPath}`)
}

console.log(
  "\nDone. Delete the files this route doesn't need (e.g. validator.zod.ts if it has no form), then format it with `bunx prettier --write`. Data goes through guarded readers: see references/nextjs.md."
)
