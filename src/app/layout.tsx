import { Locales } from '@/constants/enum'
import { fontInter, fontThai } from '@/constants/fonts'
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
      <head>
        <link rel='preconnect' href='https://picsum.photos' />
        <link rel='preconnect' href='https://fastly.picsum.photos' />
        <link rel='preconnect' href='https://pravatar.cc' />
        <link rel='preconnect' href='https://i.pravatar.cc' />
      </head>

      <body
        className={cls(fontInter.variable, fontThai.variable)}
        style={{
          backgroundColor: '#0a0a0a'
        }}>
        {children}
      </body>
    </html>
  )
}
