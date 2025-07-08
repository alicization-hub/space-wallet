import { Providers } from '@/components/providers'
import { Locales } from '@/constants/enum'
import { fontNumber, fontUbuntu } from '@/constants/fonts'
import { cls } from '@/libs/utils'

import '@/styles/globals.css'

export { metadata, viewport } from '@/constants/metadata'

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang={Locales.UK} style={{ colorScheme: 'dark' }}>
      <body className={cls(fontUbuntu.variable, fontNumber.variable)} style={{ backgroundColor: '#0a0a0a' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
