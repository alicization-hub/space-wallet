import { connection } from "next/server"

import { readNodeInfo } from "@/actions/rpc"
import { Navbar } from "@/components/layout/navbar"
import { AppProviders } from "@/components/layout/provider"
import { ScreenNotice } from "@/components/screen-notice"
import { fontNumber, fontUbuntu } from "@/constants/fonts"
import { cls } from "@/libs/utils"

import "@/styles/globals.css"

export { metadata, viewport } from "@/constants/metadata"

/**
 * Opts out of the static shell. Every page must render per request so its scripts get the CSP nonce
 * from `src/proxy.ts`: a prerendered script has none and the browser would block it.
 */
export const instant = false

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  await connection()
  const node = await readNodeInfo()

  return (
    <html lang='en-US' style={{ colorScheme: "dark" }}>
      <body
        className={cls(fontUbuntu.variable, fontNumber.variable)}
        style={{ backgroundColor: "#0a0a0a" }}>
        <AppProviders>
          <main className='app-wrapper min-h-svh'>
            <Navbar node={node} />
            <ScreenNotice />
            <div className='app-router max-w-space mx-auto hidden lg:block'>
              {children}
            </div>
          </main>
        </AppProviders>
      </body>
    </html>
  )
}
